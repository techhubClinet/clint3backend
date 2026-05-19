/**
 * Import creative-ops JSON backup into MongoDB via API.
 * Usage: node src/scripts/importBackupFile.js [path-to-backup.json] [brandName]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { settings } from "../config/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = settings.apiBase.replace(/\/$/, "");

const backupPath =
  process.argv[2] ||
  path.resolve(__dirname, "../../../creative-ops-backup-2026-05-10.json");
const brandName = process.argv[3] || "OriginDrops";

async function main() {
  const email = settings.adminEmail;
  const password = settings.adminPassword;
  if (!email || !password) {
    console.error("Set adminEmail and adminPassword in src/config/settings.js");
    process.exit(1);
  }
  if (!fs.existsSync(backupPath)) {
    console.error("Backup not found:", backupPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  console.log("Backup:", backupPath);
  console.log(
    "Counts:",
    "batches",
    data.batches?.length ?? 0,
    "loops",
    data.loops?.length ?? 0,
    "docs",
    data.docs?.length ?? 0,
    "ideas",
    data.ideas?.length ?? 0
  );

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok) throw new Error(login.error || "Login failed");
  const token = login.token;

  const brandsRes = await fetch(`${base}/api/brands`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const brands = await brandsRes.json();
  let brand = brands.find((b) => b.name === brandName);
  if (!brand) {
    const createRes = await fetch(`${base}/api/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: brandName }),
    });
    brand = await createRes.json();
    if (!createRes.ok) throw new Error(brand.error || "Create brand failed");
    console.log("Created brand:", brandName);
  }

  const impRes = await fetch(
    `${base}/api/import/json?brandId=${brand.id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  const result = await impRes.json();
  if (!impRes.ok) throw new Error(result.error || "Import failed");

  const batchesRes = await fetch(`${base}/api/brands/${brand.id}/batches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const batches = await batchesRes.json();

  console.log("\nImport OK for brand:", brandName, `(${brand.id})`);
  console.log("Stats:", JSON.stringify(result.stats, null, 2));
  console.log("Batches in DB now:", batches.length);
  console.log("\nRefresh http://localhost:5173 → Settings → log in → Dashboard should show data.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
