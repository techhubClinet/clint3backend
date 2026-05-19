# Creative Ops API

Production-oriented REST backend for the Creative Ops React app: JWT authentication, MongoDB persistence (matching your JSON backup shape), JSON import/upsert, Cloudinary media uploads, and optional scheduled JSON backups to Cloudinary.

## Features

- **Auth**: Single-admin workflow — `POST /api/auth/register` works only until the first user exists; afterwards use `POST /api/auth/login` for JWT (`Authorization: Bearer <token>`).
- **Entities**: Brands, batches (flexible schema), feedback loops, research docs, ideas — CRUD under `/api/brands/:brandId/...`.
- **Import**: `POST /api/import/json` accepts the same structure as your export file (`batches`, `loops`, `docs`, `ideas`, optional `exportDate`). Upserts by legacy `id` per brand to avoid duplicates.
- **Media**: `POST /api/upload` (multipart field `file`) uploads to Cloudinary; URL returned for storing on entities (e.g. `imageData`, links).
- **Backup**: `GET /api/backup/export?brandId=` returns one brand in export shape. `GET /api/backup/export-full` returns all brands. Optional cron uploads full JSON to Cloudinary when `ENABLE_SCHEDULED_BACKUPS=true`.

## Requirements

- Node.js 18+
- MongoDB (MongoDB Atlas recommended for hosted environments)

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, ADMIN_* for seeding
npm install --cache ./.npm-cache   # or npm install if ~/.npm is writable
```

### Create the admin user (once)

```bash
npm run seed:admin
```

Alternatively, call `POST /api/auth/register` once while the database has zero users.

### Run locally

```bash
npm run dev
```

Health check: `GET http://localhost:4000/health`

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Listen port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string (**required**) |
| `JWT_SECRET` | Secret for signing JWT (**required** in production) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_ORIGIN` | CORS origin for your React app |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed:admin` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media + optional scheduled backups |
| `CLOUDINARY_UPLOAD_FOLDER` | Prefix folder (default `creative-ops`) |
| `ENABLE_SCHEDULED_BACKUPS` | `true` to run cron JSON dumps to Cloudinary |
| `BACKUP_CRON` | Cron expression (default `0 3 * * *` daily 03:00) |
| `BACKUP_TIMEZONE` | IANA timezone for cron (default `UTC`) |

## API overview

All routes except `/health`, `/api/auth/register`, and `/api/auth/login` require:

```http
Authorization: Bearer <jwt>
```

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | First user only |
| POST | `/api/auth/login` | Returns JWT |
| GET | `/api/auth/me` | Current user |

### Brands

| Method | Path |
|--------|------|
| GET/POST | `/api/brands` |
| PATCH/DELETE | `/api/brands/:brandId` |

### Batches, loops, docs, ideas

Replace `<entity>` with `batches`, `loops`, `docs`, or `ideas`:

| Method | Path |
|--------|------|
| GET | `/api/brands/:brandId/<entity>` |
| GET | `/api/brands/:brandId/<entity>/:legacyId` |
| POST | `/api/brands/:brandId/<entity>` |
| PUT/PATCH | `/api/brands/:brandId/<entity>/:legacyId` |
| DELETE | `/api/brands/:brandId/<entity>/:legacyId` |

Legacy IDs are the string `id` fields from your JSON (not Mongo `_id`).

### Import

`POST /api/import/json`

- **Multipart**: form field `file` = backup `.json`; optional fields `brandId`, `brandName`.
- **Raw JSON**: `Content-Type: application/json` with the backup object; brand scope via query `?brandId=` or `?brandName=` (defaults to creating/using **OriginDrops**).

### Upload

`POST /api/upload` — multipart field `file`; optional `brandId` form field or query.

### Backup

| Method | Path |
|--------|------|
| GET | `/api/backup/export?brandId=` |
| GET | `/api/backup/export-full` |
| POST | `/api/backup/upload-remote` | Uploads full DB JSON to Cloudinary (manual test of backup pipeline) |

## Example: login and import backup

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}' | jq -r .token)

curl -s -X POST "http://localhost:4000/api/import/json?brandName=OriginDrops" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @../creative-ops-backup-2026-05-10.json
```

## Deploying (free tier)

### Render

1. Create a MongoDB Atlas cluster and whitelist `0.0.0.0/0` (or Render egress IPs) for development.
2. New **Web Service** from this repo, root directory `backend`, build `npm install`, start `npm start`.
3. Set environment variables in the dashboard (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, optional Cloudinary).
4. Use the provided `render.yaml` as a Blueprint if you prefer infrastructure-as-code.

**Sleep / spin-down**: Free Render web services sleep after inactivity; upgrade or use a cron ping service if you need strict 24/7 wake behavior without cold starts.

### Railway / Fly.io

Same idea: Node service, `npm start`, inject the same env vars. Fly.io can keep a small VM running with a `fly.toml` (see Fly docs for Node).

### Vercel

Vercel is serverless-oriented; long-lived cron and large upload bodies map better to Render/Railway/Fly for this API.

## Database backups

1. **Application-level**: Enable `ENABLE_SCHEDULED_BACKUPS` with Cloudinary configured — full JSON snapshots upload daily (cron).
2. **MongoDB Atlas**: Use Atlas backup/snapshot features on paid tiers; on M0 free tier, schedule periodic `GET /api/backup/export-full` via an authenticated cron job or manual downloads.

## JSON ↔ database mapping

Your export shape is preserved:

- `batches` → `Batch` documents (`strict: false` so optional fields like `brief`, `desire`, `parentId` remain).
- `loops` → `FeedbackLoop`
- `docs` → `ResearchDoc` (`title`, `content`, `createdAt`, `updatedAt`, …)
- `ideas` → `Idea`

Each record is keyed by `(brandId + id)` so re-importing the same backup updates rows instead of duplicating.

## Frontend integration

The single-file UI `creative-ops-system (12).jsx` now supports optional cloud sync:

1. Set **`VITE_API_URL`** in your Vite env (e.g. `https://your-api.onrender.com`) **or** assign **`window.__CREATIVE_OPS_API__`** before the app loads.
2. Open **Settings → Data Management → Backend API**, log in with your admin account.
3. Edits debounce to the server (~500ms): deleted rows are removed via the API, then the current snapshot is upserted with `POST /api/import/json`. Local `window.storage` is still updated as a cache/offline copy.

CORS: set **`CLIENT_ORIGIN`** on the server to your web app origin (or `*` for development only).
