// Live results for a second screen. Polls the server every few seconds and keeps
// its own copy on this device. If the server restarts (and forgets everything),
// the dashboard sends its copy back so no screen loses the evening.
// The ☰ menu (top right) resets the evening and hides unsuitable names; both ask
// for the ADMIN_KEY set on Render. Shortcuts: Shift+R, and Shift+click a name.

const POLL_MS = 4000;
const CACHE_KEY = "beTheBoss.dashboard";
const KEEP_MS = 18 * 60 * 60 * 1000;

const $ = id => document.getElementById(id);
const money = n => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const avg = list => (list.length ? list.reduce((a, x) => a + x.profit, 0) / list.length : 0);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let store = loadCache();
let lastBoot = store.boot;
let lastSeq = store.seq || 0;
let shownIds = new Set();

function loadCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return { boot: c.boot, seq: c.seq, resetAt: c.resetAt || 0, lastOk: c.lastOk || 0, results: c.results || {} };
  } catch { return { resetAt: 0, results: {} }; }
}
function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...store, boot: lastBoot, seq: lastSeq })); } catch { }
}
function current() {
  const cutoff = Math.max(Date.now() - KEEP_MS, store.resetAt);
  return Object.values(store.results).filter(r => r.t > cutoff);
}

async function poll() {
  try {
    const after = lastBoot ? lastSeq : 0;
    const res = await fetch(`api/results?after=${after}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (data.boot !== lastBoot) {
      // Server restarted and lost its memory: hand back what this screen saw,
      // so every dashboard and game device agrees again, then fetch everything
      // (only if this screen was live recently, so a tab left closed for hours
      // can't bring back games from before a reset)
      const restarted = Boolean(lastBoot) && Date.now() - store.lastOk < 10 * 60 * 1000;
      lastBoot = data.boot;
      lastSeq = 0;
      if (restarted) await restore();
      if (after !== 0) return poll();
    }
    if (data.resetAt > store.resetAt) {
      store.resetAt = data.resetAt;
      store.results = {};
    }
    data.results.forEach(r => (store.results[r.id] = r));
    lastSeq = data.seq;
    store.lastOk = Date.now();
    saveCache();
    setStatus(true);
  } catch {
    setStatus(false);
  }
  render();
}

async function restore() {
  const mine = current().map(({ id, t, name, choices }) => ({ id, t, name, choices }));
  for (let i = 0; i < mine.length; i += 500) {
    await fetch("api/restore", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: mine.slice(i, i + 500) }),
    }).catch(() => null);
  }
}

function setStatus(ok) {
  $("status").className = "status " + (ok ? "ok" : "bad");
  $("status").querySelector("span").textContent = ok ? "Live" : "Offline, showing saved results";
}

// ---- Rendering ----
function render() {
  const all = current();
  $("empty").classList.toggle("show", all.length === 0);
  const byProfit = [...all].sort((a, b) => b.profit - a.profit);

  $("kGames").textContent = all.length.toLocaleString("en-GB");
  $("kAvg").textContent = money(avg(all));
  $("kWin").textContent = all.length ? Math.round((100 * all.filter(r => r.profit > 0).length) / all.length) + "%" : "0%";
  $("kBest").textContent = byProfit[0] ? money(byProfit[0].profit) : "–";
  $("kBestName").textContent = byProfit[0] ? `${PRODUCTS[byProfit[0].choices.product].emoji} ${byProfit[0].name}` : "";
  $("kBestName").dataset.id = byProfit[0] ? byProfit[0].id : "";

  $("leader").innerHTML = byProfit.slice(0, 10).map((r, i) => `
    <li data-id="${r.id}" class="${shownIds.size && !shownIds.has(r.id) ? "new" : ""}">
      <span class="rank">${["🥇", "🥈", "🥉"][i] || i + 1}</span>
      <span class="who">${PRODUCTS[r.choices.product].emoji} ${esc(r.name)}</span>
      <span class="st">${"★".repeat(r.stars)}</span>
      <b class="${r.profit < 0 ? "neg" : ""}">${money(r.profit)}</b>
    </li>`).join("");

  renderProducts(all);
  renderChoices(all);
  renderStars(all);
  renderGoals(all);
  renderInsight(all);

  // Latest game, under the count, so new arrivals are visible
  const latest = all.reduce((a, r) => (!a || r.t > a.t ? r : a), null);
  $("kLatest").innerHTML = latest
    ? `<span class="${shownIds.size && !shownIds.has(latest.id) ? "new" : ""}" data-id="${latest.id}">Latest: ${PRODUCTS[latest.choices.product].emoji} ${esc(latest.name)} · ${money(latest.profit)}</span>`
    : "";

  shownIds = new Set(all.map(r => r.id));
  if (!shownIds.size) shownIds = new Set(["none"]);
}

// Pie of which business people chose. Eleven slices are too thin to tell apart,
// so the seven most popular get their own colour and the rest share "Other".
const SLICE_COLOURS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"];
const OTHER_COLOUR = "#b9b6c9";
const PIE_SLOTS = SLICE_COLOURS.length;

function renderProducts(all) {
  const rows = Object.entries(PRODUCTS).map(([id, p]) => {
    const list = all.filter(r => r.choices.product === id);
    return { p, n: list.length, avg: avg(list) };
  }).sort((a, b) => b.n - a.n || a.p.name.localeCompare(b.p.name));
  rows.forEach((r, i) => (r.colour = i < PIE_SLOTS && r.n ? SLICE_COLOURS[i] : OTHER_COLOUR));

  const total = all.length;
  const slices = rows.slice(0, PIE_SLOTS).filter(r => r.n).map(r => ({ label: `${r.p.emoji} ${r.p.name}`, n: r.n, colour: r.colour }));
  const otherN = rows.slice(PIE_SLOTS).reduce((a, r) => a + r.n, 0);
  if (otherN) slices.push({ label: "Other", n: otherN, colour: OTHER_COLOUR });

  // Donut drawn as stroked circles; a small gap separates neighbouring slices
  const R = 40, C = 2 * Math.PI * R, gap = slices.length > 1 ? 1.2 : 0;
  let offset = 0;
  const arcs = slices.map(s => {
    const len = (s.n / total) * C;
    const arc = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="${s.colour}" stroke-width="18"
      stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-offset}"><title>${s.label}: ${s.n} (${Math.round((100 * s.n) / total)}%)</title></circle>`;
    offset += len;
    return arc;
  }).join("");
  $("pie").innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="Businesses chosen">
      <circle r="${R}" cx="50" cy="50" fill="none" stroke="var(--track)" stroke-width="18"></circle>${arcs}</svg>
    <div class="pie-centre"><b>${total}</b><span>businesses</span></div>`;

  $("pieLegend").innerHTML = `<li class="head"><span></span><span></span><span>Business</span><span>Chose</span><span>Avg profit</span></li>` +
    rows.map(r => `
    <li class="${r.n ? "" : "zero"}" title="${r.n} chose ${r.p.name}, average profit ${money(r.avg)}">
      <span class="sw" style="--c:${r.colour}"></span><span>${r.p.emoji}</span><span class="nm">${r.p.name}</span>
      <em>${total ? Math.round((100 * r.n) / total) : 0}%</em>
      <b class="${r.avg < 0 ? "neg" : ""}">${r.n ? money(r.avg) : "–"}</b>
    </li>`).join("");
}

// One column per decision, plus the goals. Shipping only counts online sellers.
// Columns with more than 6 options show the 6 most popular so they line up.
function renderChoices(all) {
  const columns = DECISIONS.map(d => {
    const pool = d.when ? all.filter(r => d.when(r.choices)) : all;
    return { title: `${d.icon} ${d.name}`, pool, rows: d.options.map(o => ({ emoji: o.emoji, label: o.short, n: pool.filter(r => r.choices[d.key] === o.id).length })) };
  });
  $("choices").innerHTML = columns.map(col => {
    let rows = col.rows.map(r => ({ ...r, pct: col.pool.length ? Math.round((100 * r.n) / col.pool.length) : 0 }));
    if (rows.length > 6) rows = [...rows].sort((a, b) => b.n - a.n).slice(0, 6);
    // Bars are scaled to the most popular option so the winner is easy to spot
    const top = Math.max(1, ...rows.map(r => r.pct));
    return `<div class="choice"><h3>${col.title}</h3>` + rows.map(r => `
      <div class="crow" title="${r.pct}% chose ${r.label}">
        <span class="ce">${r.emoji}</span><span class="cl">${r.label}</span><b>${r.pct}%</b>
        <div class="cbar"><i style="width:${(100 * r.pct) / top}%"></i></div>
      </div>`).join("") + "</div>";
  }).join("");
}

// Goals: how many chose each, how many hit the target, and their average profit.
// Results don't store whether a goal was hit, so it's worked out again from the
// choices (once per game, then remembered).
const goalHitCache = {};
function goalHits(r) {
  if (!goalHitCache[r.id]) {
    try { goalHitCache[r.id] = simulate(r.choices).goalResults; } catch { goalHitCache[r.id] = []; }
  }
  return goalHitCache[r.id];
}
function renderGoals(all) {
  const rows = GOALS.map(g => {
    const list = all.filter(r => (r.choices.objectives || []).includes(g.id));
    const hit = list.filter(r => goalHits(r).some(x => x.id === g.id && x.hit)).length;
    return { g, n: list.length, hitPct: list.length ? Math.round((100 * hit) / list.length) : 0, avg: avg(list) };
  }).sort((a, b) => b.n - a.n || a.g.label.localeCompare(b.g.label));
  const players = Math.max(1, all.length);
  $("goalTable").innerHTML = `<li class="head"><span></span><span>Goal</span><span>Chose</span><span>Hit target</span><span>Avg profit</span></li>` +
    rows.map(r => `
    <li class="${r.n ? "" : "zero"}" title="${r.n} chose ${r.g.label}; ${r.hitPct}% hit the target; average profit ${money(r.avg)}">
      <span>${r.g.emoji}</span><span class="nm">${r.g.short}</span>
      <em>${Math.round((100 * r.n) / players)}%</em>
      <span class="hitbar"><i style="width:${r.hitPct}%"></i><b>${r.n ? r.hitPct + "%" : "–"}</b></span>
      <b class="${r.avg < 0 ? "neg" : ""}">${r.n ? money(r.avg) : "–"}</b>
    </li>`).join("");
}

const STAR_TITLES = ["Back to the drawing board", "Just about surviving", "Solid start", "Rising star", "Business tycoon"];
function renderStars(all) {
  const counts = [1, 2, 3, 4, 5].map(s => all.filter(r => r.stars === s).length);
  const max = Math.max(1, ...counts);
  $("stars").innerHTML = counts.map((n, i) => `
    <div class="star-tile" title="${n} businesses got ${i + 1} star${i ? "s" : ""}">
      <span class="s">${"★".repeat(i + 1)}<i>${"★".repeat(4 - i)}</i></span><span class="n">${n}</span>
      <span class="t">${STAR_TITLES[i]}${all.length ? ` · ${Math.round((100 * n) / all.length)}%` : ""}</span>
      <div class="sbar"><i style="width:${(100 * n) / max}%"></i></div>
    </div>`).join("");
}

// The single choice that made the biggest difference to profit tonight
function renderInsight(all) {
  const el = $("insight");
  if (all.length < 8) { el.innerHTML = ""; return; }
  let best = null;
  for (const d of DECISIONS) {
    const pool = d.when ? all.filter(r => d.when(r.choices)) : all;
    for (const o of d.options) {
      const yes = pool.filter(r => r.choices[d.key] === o.id);
      const no = pool.filter(r => r.choices[d.key] !== o.id);
      if (yes.length < 3 || no.length < 3) continue;
      const diff = avg(yes) - avg(no);
      if (!best || diff > best.diff) best = { diff, o };
    }
  }
  if (!best || best.diff <= 0) { el.innerHTML = ""; return; }
  el.innerHTML = `<span>💡 Tonight's big lesson</span>
    <p>People who <b>${best.o.phrase}</b> made <b>${money(best.diff)}</b> more on average.</p>`;
}

function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return Math.round(s / 60) + " min ago";
  return Math.round(s / 3600) + " h ago";
}

// ---- Admin: ☰ menu with reset and hide-a-name (Shift+R and Shift+click also work) ----
const KEY_STORE = "beTheBoss.key";
function adminKey(question) {
  let key = "";
  try { key = sessionStorage.getItem(KEY_STORE) || ""; } catch { }
  return key || prompt(question + "\n\nEnter the ADMIN_KEY (Render → your service → Environment):") || "";
}
function rememberKey(key) {
  try { sessionStorage.setItem(KEY_STORE, key); } catch { }
}
// Sends an admin request; on a wrong key, forgets it so the next try asks again
async function adminPost(path, question, body) {
  const key = adminKey(question);
  if (!key) return null;
  const res = await fetch(path, {
    method: "POST",
    headers: { "x-admin-key": key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  if (res && res.status === 403) {
    try { sessionStorage.removeItem(KEY_STORE); } catch { }
    alert("Wrong key, or no ADMIN_KEY is set on Render.");
    return null;
  }
  if (!res || !res.ok) { alert("Couldn't reach the server. Try again in a moment."); return null; }
  rememberKey(key);
  return res.json();
}

async function resetBoard() {
  if (!confirm("Clear ALL results for every screen?\n\nThis can't be undone.")) return;
  const data = await adminPost("api/reset", "Reset the leaderboard");
  if (!data) return;
  store = { resetAt: data.resetAt, lastOk: Date.now(), results: {} };
  saveCache();
  render();
}

async function hideName(id) {
  const r = store.results[id];
  if (!r || !confirm(`Replace the name "${r.name}" with a ready-made one?`)) return;
  const data = await adminPost("api/hide", "Hide this name", { id });
  if (!data) return;
  store.results[data.entry.id] = data.entry;
  saveCache();
  render();
}

function setHideMode(on) { document.body.classList.toggle("hide-mode", on); }

function toggleMenu(open) {
  const list = $("menuList");
  const show = open === undefined ? list.hidden : open;
  list.hidden = !show;
  $("menuBtn").setAttribute("aria-expanded", String(show));
}
$("menuBtn").addEventListener("click", e => { e.stopPropagation(); toggleMenu(); });
$("mReset").addEventListener("click", () => { toggleMenu(false); resetBoard(); });
$("mHide").addEventListener("click", () => { toggleMenu(false); setHideMode(true); });
$("mFull").addEventListener("click", () => {
  toggleMenu(false);
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => { });
});
$("hideDone").addEventListener("click", () => setHideMode(false));

document.addEventListener("click", e => {
  if (!e.target.closest(".menu")) toggleMenu(false);
  const row = e.target.closest("[data-id]");
  if (!row || !row.dataset.id) return;
  if (e.shiftKey || document.body.classList.contains("hide-mode")) hideName(row.dataset.id);
});
document.addEventListener("keydown", e => {
  if (e.key === "Shift") document.body.classList.add("hiding");
  if (e.key === "Escape") { toggleMenu(false); setHideMode(false); }
  if (e.shiftKey && e.key === "R") resetBoard();
});
document.addEventListener("keyup", e => { if (e.key === "Shift") document.body.classList.remove("hiding"); });

render();
poll();
setInterval(poll, POLL_MS);
