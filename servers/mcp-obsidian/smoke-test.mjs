#!/usr/bin/env node
/**
 * Smoke test — tests the same API calls our ObsidianClient makes.
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED=0 node --env-file=.env smoke-test.mjs
 */

const API_KEY = process.env.OBSIDIAN_API_KEY;
const BASE_URL = process.env.OBSIDIAN_API_URL || "https://localhost:27124";
if (!API_KEY) { console.error("Set OBSIDIAN_API_KEY"); process.exit(1); }

const headers = { Authorization: `Bearer ${API_KEY}` };

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function api(method, path, body, accept) {
  const opts = { method, headers: { ...headers } };
  if (accept) opts.headers["Accept"] = accept;
  if (body && method !== "GET") {
    if (typeof body === "string") {
      opts.headers["Content-Type"] = "text/markdown";
      opts.body = body;
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const r = await fetch(`${BASE_URL}${path}`, opts);
  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("json") ? await r.json() : await r.text();
  return { status: r.status, ok: r.ok, data };
}

test("GET / — status", async () => {
  const { data } = await api("GET", "/");
  if (data.status !== "OK") throw new Error(`Bad status: ${data.status}`);
  console.log(`    → OK, plugin v${data.manifest?.version}, authenticated=${data.authenticated}`);
});

test("GET /vault/ — list root", async () => {
  const { data } = await api("GET", "/vault/");
  if (!data.files || data.files.length === 0) throw new Error("Empty vault");
  console.log(`    → ${data.files.length} items at root`);
});

test("GET /vault/Eichi/ — list subfolder", async () => {
  const { data } = await api("GET", "/vault/Eichi/");
  if (!data.files) throw new Error("No files array");
  console.log(`    → ${data.files.length} items in Eichi/`);
});

test("GET /vault/<file> — read markdown", async () => {
  const { data: list } = await api("GET", "/vault/");
  const md = list.files.find(f => f.endsWith(".md"));
  if (!md) throw new Error("No .md at root");
  const { data, status } = await api("GET", `/vault/${encodeURIComponent(md)}`, undefined, "text/markdown");
  if (status !== 200) throw new Error(`Status ${status}`);
  console.log(`    → ${md}: ${data.length} chars`);
});

test("POST /search/simple/?query= — search", async () => {
  const { data } = await api("POST", `/search/simple/?query=${encodeURIComponent("Shinkofa")}`);
  if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`);
  console.log(`    → ${data.length} results for 'Shinkofa'`);
});

test("GET /vault/nonexistent.md — 404 handling", async () => {
  const { status } = await api("GET", "/vault/this-does-not-exist-99999.md", undefined, "text/markdown");
  if (status !== 404) throw new Error(`Expected 404, got ${status}`);
  console.log(`    → Correctly returns 404`);
});

test("PUT + DELETE /vault/ — write then cleanup", async () => {
  const testPath = "_smoke-test-temp.md";
  const content = "# Smoke Test\nCreated by smoke-test.mjs — safe to delete.";
  const { status: writeStatus } = await api("PUT", `/vault/${testPath}`, content);
  if (writeStatus !== 204 && writeStatus !== 200) throw new Error(`Write failed: ${writeStatus}`);
  // Verify it exists
  const { data: readBack } = await api("GET", `/vault/${testPath}`, undefined, "text/markdown");
  if (!readBack.includes("Smoke Test")) throw new Error("Content mismatch");
  // Delete
  const { status: delStatus } = await api("DELETE", `/vault/${testPath}`);
  if (delStatus !== 204 && delStatus !== 200) throw new Error(`Delete failed: ${delStatus}`);
  console.log(`    → Write, read-back, delete all OK`);
});

// Run
let pass = 0, fail = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log(`  PASS  ${t.name}`);
    pass++;
  } catch (e) {
    console.log(`  FAIL  ${t.name}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${pass}/${tests.length} passed`);
if (fail > 0) process.exit(1);
