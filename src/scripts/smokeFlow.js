/**
 * End-to-end API smoke test.
 * Terminal 1: npm run dev   (or: node src/server.js)
 * Terminal 2: npm run test:flow
 *
 * Uses src/config/settings.js
 */
import { settings } from "../config/settings.js";

const base = settings.apiBase.replace(/\/$/, "");

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { ok: r.ok, status: r.status, json };
}

function fail(msg) {
  console.error("\n✖", msg);
  process.exit(1);
}

async function main() {
  const email = settings.adminEmail;
  const password = settings.adminPassword;

  console.log("Creative Ops API smoke test");
  console.log("Base URL:", base);

  let h = await req("/health");
  if (!h.ok) fail(`/health failed (${h.status}). Is the server running? (npm run dev)`);
  console.log("✓ GET /health", h.json);

  if (!email || !password) {
    fail("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env (same as seed:admin).");
  }

  let login = await req("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!login.ok) {
    console.log(login.status, login.json);
    fail(
      "Login failed. Run once: npm run seed:admin (only works when DB has zero users)."
    );
  }
  const token = login.json.token;
  if (!token) fail("Login response missing token");
  console.log("✓ POST /api/auth/login");

  let me = await req("/api/auth/me", { token });
  if (!me.ok) fail(`/api/auth/me failed (${me.status})`);
  console.log("✓ GET /api/auth/me", me.json.email);

  let brands = await req("/api/brands", { token });
  if (!brands.ok) fail(`/api/brands failed (${brands.status})`);
  let brandId = brands.json[0]?.id;
  if (!brandId) {
    const created = await req("/api/brands", {
      method: "POST",
      token,
      body: { name: "SmokeTestBrand" },
    });
    if (!created.ok) fail(`POST /api/brands failed: ${JSON.stringify(created.json)}`);
    brandId = created.json.id;
    console.log("✓ POST /api/brands (created test brand)");
  } else {
    console.log("✓ GET /api/brands (using first brand:", brands.json[0].name + ")");
  }

  const importBody = {
    batches: [
      {
        id: "smoke-batch-1",
        name: "Smoke Batch",
        date: "2026-05-13",
        type: "Video",
        isNew: "Ideation",
        origin: "",
        get: "",
        who: "",
        to: "",
        by: "",
        purchaseTrigger: "",
        awareness: "Problem Aware",
        sophistication: "Level 4 - sophistication",
        beliefBefore: "",
        beliefAfter: "",
        hypothesis: "API smoke test",
        script: "",
        status: "Concept",
        result: "Data Awaiting",
        angle: "",
      },
    ],
    loops: [
      {
        id: "smoke-loop-1",
        batchId: "smoke-batch-1",
        videoLink: "",
        imageData: "",
        hypothesisWhy: "",
        actionPlan: "",
        completed: false,
        createdAt: "2026-05-13",
      },
    ],
    docs: [],
    ideas: [
      {
        id: "smoke-idea-1",
        date: "2026-05-13",
        idea: "Smoke idea",
        inspo: "",
        status: "Pending",
      },
    ],
    exportDate: new Date().toISOString(),
  };

  let imp = await req(`/api/import/json?brandId=${brandId}`, {
    method: "POST",
    token,
    body: importBody,
  });
  if (!imp.ok) fail(`POST /api/import/json failed: ${JSON.stringify(imp.json)}`);
  console.log("✓ POST /api/import/json", imp.json.stats || imp.json);

  let batches = await req(`/api/brands/${brandId}/batches`, { token });
  if (!batches.ok) fail(`GET batches failed (${batches.status})`);
  const found = batches.json.some((b) => b.id === "smoke-batch-1");
  if (!found) fail("Imported batch not found in GET /batches");
  console.log("✓ GET /api/brands/:id/batches (smoke record present)");

  console.log("\nAll API checks passed. Next: open http://localhost:5173 → Settings → log in → confirm Connected.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
