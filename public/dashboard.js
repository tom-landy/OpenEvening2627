// Live results for a second screen. Polls the server every few seconds and keeps
// its own copy on this device, so a server restart doesn't wipe the evening.
// Shift+R resets the evening (asks for the ADMIN_KEY set on Render).
// Hold Shift and click a business name to swap a rude or real name for a ready-made one.

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
    return { boot: c.boot, seq: c.seq, resetAt: c.resetAt || 0, results: c.results || {} };
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
      // Server restarted: everything it has is new to us
      lastBoot = data.boot;
      lastSeq = 0;
      if (after !== 0) return poll();
    }
    if (data.resetAt > store.resetAt) {
      store.resetAt = data.resetAt;
      store.results = {};
    }
    data.results.forEach(r => (store.results[r.id] = r));
    lastSeq = data.seq;
    saveCache();
    setStatus(true);
  } catch {
    setStatus(false);
  }
  render();
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
  renderInsight(all);

  const latest = [...all].sort((a, b) => b.t - a.t).slice(0, 5);
  $("feed").innerHTML = latest.map(r => `
    <li data-id="${r.id}" class="${shownIds.size && !shownIds.has(r.id) ? "new" : ""}">
      <span>${PRODUCTS[r.choices.product].emoji} ${esc(r.name)}</span>
      <small>${ago(r.t)}</small>
      <b class="${r.profit < 0 ? "neg" : ""}">${money(r.profit)}</b>
    </li>`).join("");

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

function renderChoices(all) {
  $("choices").innerHTML = DECISIONS.map(d => {
    const rows = d.options.map(o => {
      const n = all.filter(r => r.choices[d.key] === o.id).length;
      return { emoji: o.emoji, label: o.short, pct: all.length ? Math.round((100 * n) / all.length) : 0 };
    });
    // Bars are scaled to the most popular option so the winner is easy to spot
    const top = Math.max(1, ...rows.map(r => r.pct));
    return `<div class="choice"><h3>${d.icon} ${d.name}</h3>` + rows.map(r => `
      <div class="crow" title="${r.pct}% chose ${r.label}">
        <span class="ce">${r.emoji}</span><span class="cl">${r.label}</span><b>${r.pct}%</b>
        <div class="cbar"><i style="width:${(100 * r.pct) / top}%"></i></div>
      </div>`).join("") + "</div>";
  }).join("");
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
    for (const o of d.options) {
      const yes = all.filter(r => r.choices[d.key] === o.id);
      const no = all.filter(r => r.choices[d.key] !== o.id);
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

// ---- Admin: hide a name, reset the evening ----
function adminKey(question) {
  let key = "";
  try { key = sessionStorage.getItem("beTheBoss.key") || ""; } catch { }
  return key || prompt(question + "\n\nEnter the ADMIN_KEY (Render → your service → Environment):") || "";
}
function rememberKey(key) {
  try { sessionStorage.setItem("beTheBoss.key", key); } catch { }
}
document.addEventListener("keydown", e => { if (e.key === "Shift") document.body.classList.add("hiding"); });
document.addEventListener("keyup", e => { if (e.key === "Shift") document.body.classList.remove("hiding"); });
document.addEventListener("click", async e => {
  const row = e.shiftKey && e.target.closest("[data-id]");
  if (!row || !row.dataset.id) return;
  const r = store.results[row.dataset.id];
  if (!r || !confirm(`Replace the name "${r.name}" with a ready-made one?`)) return;
  const key = adminKey("Hide this name");
  if (!key) return;
  const res = await fetch("api/hide", { method: "POST", headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) }).catch(() => null);
  if (!res || !res.ok) { alert(res && res.status === 403 ? "Wrong key, or no ADMIN_KEY is set on Render." : "Couldn't change that name."); return; }
  rememberKey(key);
  const data = await res.json();
  store.results[data.entry.id] = data.entry;
  saveCache();
  render();
});

document.addEventListener("keydown", async e => {
  if (!(e.shiftKey && e.key === "R")) return;
  if (!confirm("Clear ALL results for every screen?")) return;
  const key = adminKey("Reset the leaderboard");
  if (!key) return;
  const res = await fetch("api/reset", { method: "POST", headers: { "x-admin-key": key } }).catch(() => null);
  if (!res || !res.ok) { alert(res && res.status === 403 ? "Wrong key, or no ADMIN_KEY is set on Render." : "Couldn't reach the server."); return; }
  rememberKey(key);
  const data = await res.json();
  store = { resetAt: data.resetAt, results: {} };
  saveCache();
  render();
});

render();
poll();
setInterval(poll, POLL_MS);
