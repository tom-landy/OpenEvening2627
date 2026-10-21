// Serves the game and dashboard, and keeps tonight's results in memory.
// No dependencies: node server.js
//
// Privacy: a result is only the 8 choices, a randomly picked business name and the
// time. No names, IP addresses, device details or cookies are stored or logged.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const M = require("./public/model.js");

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const PUBLIC = path.join(__dirname, "public");
const MAX_RESULTS = 5000;
const KEEP_MS = 24 * 60 * 60 * 1000;

const CHOICES = {
  product: Object.keys(M.PRODUCTS),
  location: Object.keys(M.LOCATIONS),
  price: Object.keys(M.PRICES),
  quality: Object.keys(M.QUALITY),
  staff: Object.keys(M.STAFF),
  marketing: Object.keys(M.MARKETING),
  ethics: Object.keys(M.ETHICS),
  rival: Object.keys(M.RIVAL),
};

let results = [];
let resetAt = 0;
let seq = 0; // order results arrived in, so dashboards can ask for just the new ones
const BOOT = crypto.randomUUID(); // changes on restart, telling dashboards to re-fetch everything
let posts = []; // timestamps only, for a whole-site rate limit

function record(body) {
  const c = body && body.choices;
  if (!c) return null;
  const choices = {};
  for (const [k, allowed] of Object.entries(CHOICES)) {
    if (!allowed.includes(c[k])) return null;
    choices[k] = c[k];
  }
  const name = M.NAMES[choices.product].includes(body.name) ? body.name : M.NAMES[choices.product][0];
  // Work the result out here rather than trusting numbers sent by the browser
  const r = M.simulate(choices);
  const entry = {
    id: crypto.randomUUID(),
    seq: ++seq,
    // A game finished while the server was unreachable is sent later with its own time
    t: body.t > Date.now() - 12 * 3600000 && body.t <= Date.now() ? Math.round(body.t) : Date.now(),
    name,
    choices,
    profit: Math.round(r.profit),
    stars: M.starRating(r.profit),
    customers: r.customers,
    rep: Math.round(r.rep * 10) / 10,
  };
  results.push(entry);
  const cutoff = Date.now() - KEEP_MS;
  results = results.filter(x => x.t > cutoff).slice(-MAX_RESULTS);
  return entry;
}

function rankOf(entry) {
  const sorted = [...results].sort((a, b) => b.profit - a.profit);
  return { rank: sorted.findIndex(x => x.id === entry.id) + 1, total: sorted.length, top: sorted.slice(0, 5) };
}

function send(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function readBody(req, cb) {
  let data = "";
  req.on("data", chunk => {
    data += chunk;
    if (data.length > 4000) req.destroy();
  });
  req.on("end", () => {
    try { cb(JSON.parse(data || "{}")); } catch { cb(null); }
  });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

function serveFile(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { return send(res, 400, { error: "bad path" }); }
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/dashboard") urlPath = "/dashboard.html";
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) return send(res, 404, { error: "not found" });
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error: "not found" });
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/results" && req.method === "POST") {
    const now = Date.now();
    posts = posts.filter(t => now - t < 60000);
    if (posts.length >= 120) return send(res, 429, { error: "slow down" });
    posts.push(now);
    return readBody(req, body => {
      const entry = record(body);
      if (!entry) return send(res, 400, { error: "bad result" });
      send(res, 200, { entry, ...rankOf(entry) });
    });
  }

  if (url.pathname === "/api/results" && req.method === "GET") {
    const after = Number(url.searchParams.get("after")) || 0;
    return send(res, 200, { boot: BOOT, seq, now: Date.now(), resetAt, results: results.filter(x => x.seq > after) });
  }

  if (url.pathname === "/api/reset" && req.method === "POST") {
    if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) return send(res, 403, { error: "wrong key" });
    results = [];
    resetAt = Date.now();
    return send(res, 200, { ok: true, resetAt });
  }

  if (req.method === "GET" || req.method === "HEAD") return serveFile(req, res);
  send(res, 405, { error: "method not allowed" });
}).listen(PORT, () => console.log(`Be the Boss running on port ${PORT}`));
