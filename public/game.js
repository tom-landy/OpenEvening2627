// ---- Settings you might want to change ----
const CONFIG = {
  kicker: "Business Studies · Open Evening",
  cta: "Want to learn how real businesses make these calls? Ask us about Business Studies!",
  idleSeconds: 90,        // return to the start screen after this long with no taps
  feedbackSeconds: 4,     // how long each consequence card shows before moving on (tap skips)
};


const money = n => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const call = (v, ...args) => (typeof v === "function" ? v(...args) : v);

// ---- The 8 decisions ----
// Decisions 2 to 8 live in options.js so the dashboard can share their labels.
const STEPS = [
  {
    key: "product", icon: "🛍️", title: "What will you sell?",
    options: Object.entries(PRODUCTS).map(([id, p]) => ({ id, emoji: p.emoji, label: p.name, sub: p.sub })),
    fb: s => `Welcome to <b>${s.name}</b>! You've spent £5,000 setting up. Now let's find a home for it.`,
  },
  ...DECISIONS,
];

function feedbackFor(st, opt, r) {
  const fb = call(st.fb, state, r) || call(opt.fb, state, r);
  return typeof fb === "string" ? { emoji: opt.emoji, text: fb } : fb;
}

// ---- State ----
let state = {};
let step = 0;
let lastResult = null;
let feedbackTimer = null;
let idleTimer = null;
let feedbackShownAt = 0;

const $ = id => document.getElementById(id);

function picks() {
  const p = {};
  STEPS.forEach(st => { if (state[st.key]) p[st.key] = state[st.key]; });
  return p;
}

// ---- Screens ----
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo(0, 0);
}

function startGame() {
  state = {};
  step = 0;
  lastResult = null;
  $("panel").classList.remove("done");
  resetScene();
  resetMeters();
  show("game");
  renderStep();
}

function renderSteps() {
  $("steps").innerHTML = STEPS.map((st, i) =>
    `<li class="${i < step ? "done" : i === step ? "now" : ""}" title="${st.title}">${i < step ? stepEmoji(i) : st.icon}</li>`
  ).join("");
}
function stepEmoji(i) {
  const st = STEPS[i];
  const opt = st.options.find(o => o.id === state[st.key]);
  return opt ? opt.emoji : st.icon;
}

function renderStep() {
  renderSteps();
  const st = STEPS[step];
  $("qStep").textContent = `Decision ${step + 1} of ${STEPS.length}`;
  $("qTitle").textContent = st.title;
  const opts = $("options");
  opts.classList.remove("locked");
  opts.innerHTML = "";
  opts.classList.toggle("many", st.options.length > 3);
  opts.classList.toggle("lots", st.options.length > 6);
  st.options.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt";
    b.style.setProperty("--i", opts.children.length);
    const sub = call(o.sub, state);
    b.innerHTML = `<span class="o-emoji">${o.emoji}</span><span class="o-text"><span class="o-label">${o.label}</span><span class="o-sub">${sub}</span></span>`;
    b.addEventListener("click", () => choose(o, b));
    opts.appendChild(b);
  });
  if (st.key === "rival") $("rival").classList.add("show");
  // On phones the empty scene would push the 10 products off screen
  document.querySelector(".play").classList.toggle("first", step === 0);
}

function choose(opt, btn) {
  const st = STEPS[step];
  state[st.key] = opt.id;
  if (st.key === "product") {
    state.name = pick(NAMES[opt.id]);
  }
  btn.classList.add("picked");
  $("options").classList.add("locked");

  const r = simulate(picks());
  updateScene(st.key, r);
  updateMeters(r);
  const fb = feedbackFor(st, opt, r);
  setTimeout(() => showFeedback(fb), 350);
}

function showFeedback(fb) {
  $("fbEmoji").textContent = fb.emoji;
  $("fbText").innerHTML = fb.text;
  $("feedback").style.setProperty("--fb-time", CONFIG.feedbackSeconds + "s");
  $("question").classList.add("answered");
  $("feedback").classList.add("show");
  feedbackShownAt = Date.now();
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(next, CONFIG.feedbackSeconds * 1000);
}

function next() {
  if (!$("feedback").classList.contains("show")) return;
  clearTimeout(feedbackTimer);
  $("feedback").classList.remove("show");
  $("question").classList.remove("answered");
  step++;
  if (step < STEPS.length) renderStep();
  else finish();
}

// ---- Meters ----
function resetMeters() {
  ["mCustomers", "mRep", "mProfit"].forEach(id => {
    const v = $(id).querySelector(".m-val");
    v.textContent = "?";
    v.classList.remove("up", "down");
  });
  $("mCustomers").querySelector(".bar i").style.width = "0";
}

function updateMeters(r) {
  const prev = lastResult;
  setMeter("mCustomers", r.customers.toLocaleString("en-GB"), prev && r.customers - prev.customers);
  $("mCustomers").querySelector(".bar i").style.width = Math.min(100, (50 * r.customers) / PRODUCTS[state.product].demand) + "%";
  $("mRep").querySelector(".m-val").textContent = starText(r.rep);
  setMeter("mProfit", money(r.profit), prev && r.profit - prev.profit);
  lastResult = r;
}
function setMeter(id, text, delta) {
  const v = $(id).querySelector(".m-val");
  v.textContent = text;
  v.classList.remove("up", "down");
  if (delta > 0) v.classList.add("up");
  if (delta < 0) v.classList.add("down");
}
function starText(rep) {
  const full = Math.round(rep);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ---- Scene ----
function resetScene() {
  const scene = $("scene");
  scene.className = "scene";
  scene.querySelectorAll(".layer").forEach(l => l.classList.remove("show"));
  $("backdrop").classList.remove("show");
  $("backdrop").textContent = "";
  $("sign").textContent = "Your Business";
  $("goods").innerHTML = "";
  $("staff").innerHTML = "";
  $("queue").innerHTML = "";
  $("promo").innerHTML = "";
  $("response").textContent = "";
  document.documentElement.style.setProperty("--shop", "#ff7eb6");
}

function updateScene(key, r) {
  const p = PRODUCTS[state.product];
  if (key === "product") {
    document.documentElement.style.setProperty("--shop", p.colour);
    $("sign").textContent = state.name;
    $("url").textContent = "www." + state.name.toLowerCase().replace(/[^a-z]/g, "") + ".co.uk";
    $("goods").textContent = p.emoji;
    $("shop").classList.add("show");
  }
  if (key === "location") {
    $("scene").classList.add(state.location);
    $("backdrop").textContent = { street: "🏢🏬🏦🏨", mall: "🏬🛍️🏬", college: "🌳🏫🌳", market: "⛺🎪⛺", van: "🎡🎪🏟️", online: "📶🛰️📶" }[state.location];
    $("backdrop").classList.add("show");
  }
  if (key === "price") {
    $("pricetag").textContent = state.price === "pwyw" ? "You choose!" : pounds(r.price);
    $("pricetag").classList.add("show");
  }
  if (key === "quality") {
    const n = { bulk: 1, budget: 1, standard: 2, local: 2, fairtrade: 2, premium: 3 }[state.quality];
    const extra = { bulk: "🚢", local: "📍", fairtrade: "🌍", premium: "✨" }[state.quality];
    $("goods").innerHTML = p.emoji.repeat(n) + (extra ? `<span class="spark">${extra}</span>` : "");
  }
  if (key === "staff") {
    const who = {
      solo: [p.staff[0]], family: [p.staff[0], "👵", "🧒"], apprentice: [p.staff[0], "🧑‍🎓"],
      part: p.staff.slice(0, 2), team: p.staff, robots: [p.staff[0], "🤖"],
    }[state.staff];
    $("staff").innerHTML = who.map(w => `<span>${w}</span>`).join("");
  }
  if (key === "marketing") {
    $("promo").innerHTML = {
      none: `<div class="bubble">"Have you tried it?"</div>💬`,
      flyers: `<div class="bubble">Grand opening!</div>📄`,
      samples: `<div class="bubble">${isFood(state) ? "Free taste!" : "Free gift!"}</div>🎁`,
      billboard: `<div class="bubble">${state.name}</div>🪧`,
      social: `<div class="bubble">#${state.name.replace(/[^A-Za-z]/g, "")}</div>📸<span class="floaty">❤️</span>`,
      influencer: `<div class="bubble">1.2M followers!</div>🤳<span class="floaty">⭐</span>`,
    }[state.marketing];
    $("promo").classList.add("show");
  }
  if (key === "ethics") {
    $("eco").textContent = { plastic: "🥤", recycle: "♻️", charity: "💚", wage: "💷", solar: "☀️", volunteer: "🤝" }[state.ethics];
    $("eco").classList.add("show");
  }
  if (key === "rival") {
    $("response").textContent = { pricewar: "🔥 15% OFF", newidea: "🚀 NEW!", loyalty: "💳 Loyalty", service: "😊 5★ service", advertise: "📣 Ads!", ignore: "🙈 ..." }[state.rival];
    $("response").classList.add("show");
    if (state.rival === "pricewar" && state.price !== "pwyw") $("pricetag").textContent = pounds(r.price);
  }
  renderQueue(r);
}

function renderQueue(r) {
  if (!state.location) return;
  // Queue length is relative to how popular this product normally is
  const n = Math.max(1, Math.min(12, Math.round((6 * r.customers) / PRODUCTS[state.product].demand)));
  const people = state.location === "online" ? ["📦"] : ["🧍", "🧍‍♀️", "🚶", "🧍‍♂️", "🚶‍♀️"];
  const q = $("queue");
  const have = q.children.length;
  if (n < have) { while (q.children.length > n) q.lastChild.remove(); return; }
  for (let i = have; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = people[i % people.length];
    s.style.animationDelay = (i - have) * 0.08 + "s";
    q.appendChild(s);
  }
}

// ---- Results ----
function finish() {
  renderSteps();
  const r = simulate(picks());
  const stars = starRating(r.profit);
  $("panel").classList.add("done");

  $("rName").textContent = state.name + " · Year 1";
  countUp($("rProfit"), r.profit);
  $("rProfit").classList.toggle("loss", r.profit < 0);
  $("rSub").textContent = r.profit >= 0 ? "profit in your first year" : "loss in your first year";
  $("rStars").innerHTML = [1, 2, 3, 4, 5].map(i => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${0.9 + i * 0.15}s">⭐</span>`).join("");
  $("rTitle").textContent = ["", "Back to the drawing board 😬", "Just about surviving 😅", "Solid start 👍", "Rising star 🌟", "Business tycoon 🤑"][stars];

  // Money in vs money out, scaled to whichever is bigger
  const scale = Math.max(r.revenue, r.totalCosts) || 1;
  const parts = [
    ["Stock", r.costs.stock, "#f97316"],
    ["Rent", r.costs.rent, "#a855f7"],
    ["Wages", r.costs.wages, "#3b82f6"],
    ["Marketing", r.costs.marketing, "#ec4899"],
    ["Fees & extras", r.costs.fees, "#eab308"],
    ["Set-up", r.costs.setup, "#94a3b8"],
  ].filter(x => x[1] > 0);
  $("barIn").style.width = "0";
  $("barOut").innerHTML = parts.map(([, v, c]) => `<i style="background:${c}" data-w="${(100 * v) / scale}"></i>`).join("");
  $("valIn").textContent = money(r.revenue);
  $("valOut").textContent = money(r.totalCosts);
  $("legend").innerHTML = parts.map(([n, v, c]) => `<span style="--c:${c}">${n} ${money(v)}</span>`).join("");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $("barIn").style.width = (100 * r.revenue) / scale + "%";
    $("barOut").querySelectorAll("i").forEach(i => (i.style.width = i.dataset.w + "%"));
  }));

  $("lessons").innerHTML = lessons(r).map(([e, t], i) =>
    `<div class="lesson" style="animation-delay:${1.6 + i * 0.2}s"><span class="l-emoji">${e}</span><span>${t}</span></div>`
  ).join("");

  const entry = { name: state.name, emoji: PRODUCTS[state.product].emoji, profit: Math.round(r.profit), t: Date.now() };
  saveScore(entry);
  renderBoard($("board"), entry);
  sendResult({ choices: picks(), name: state.name, t: entry.t });
}

// ---- Sending results to the live dashboard ----
// Only the 8 choices, the random business name and the time are sent.
// Games that fail to send (wifi drop, server asleep) are kept and retried.
const PENDING_KEY = "beTheBoss.pending";
function loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; }
}
function savePending(list) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-200))); } catch { }
}
async function post(result) {
  const res = await fetch("api/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
  if (res.status === 400) return { rejected: true };
  if (!res.ok) throw new Error(res.status);
  return res.json();
}
async function sendResult(result) {
  try {
    const data = await post(result);
    if (data.top) renderServerBoard($("board"), data);
  } catch {
    savePending([...loadPending(), result]);
    return;
  }
  flushPending();
}
let flushing = false;
async function flushPending() {
  if (flushing) return;
  flushing = true;
  let list = loadPending();
  while (list.length) {
    try { await post(list[0]); } catch { break; }
    list = list.slice(1);
    savePending(list);
  }
  flushing = false;
}
function renderServerBoard(el, data) {
  el.innerHTML = `<h3>🏆 Tonight's top businesses · you came #${data.rank} of ${data.total}</h3><ol>` +
    data.top.map(s => `<li class="${s.id === data.entry.id ? "me" : ""}"><span>${PRODUCTS[s.choices.product].emoji} ${s.name}</span><b>${money(s.profit)}</b></li>`).join("") + "</ol>";
}

function lessons(r) {
  const out = [];
  const margin = r.price - r.unitCost;
  if (margin <= 0) out.push(["😱", "You sold for less than it cost to make! Every sale lost money. Price must cover your <b>costs</b>."]);
  if (r.turnedAway > 0) out.push(["😫", `You turned away ${r.turnedAway.toLocaleString()} customers a month. More staff would have earned you more. That's called <b>capacity</b>.`]);
  if ((state.staff === "team" || state.staff === "robots") && r.customers < r.capacity * 0.5) out.push(["🥱", "Your staff or machines were often idle. Wages and rent are <b>fixed costs</b>: you pay them even when it's quiet."]);
  if (r.ripOff) out.push(["😠", "High prices with cheap quality made customers angry. <b>Reputation</b> matters!"]);
  if ((state.price === "low" || state.price === "rock") && margin > 0) out.push(["🏷️", "Low prices bring crowds, but your <b>profit margin</b> on each sale was tiny."]);
  if (state.price === "luxury") out.push(["👑", "Luxury prices mean big profit per sale but very few buyers. That's a <b>niche market</b>."]);
  if (state.location === "online") out.push(["💻", "Online saved on rent, but <b>platform fees</b> took 15% of everything you sold."]);
  if ((state.location === "street" || state.location === "mall") && r.profit < 0) out.push(["🏙️", "Rent in busy places is a big <b>fixed cost</b>. You need lots of sales just to cover it."]);
  if (state.rival === "pricewar") out.push(["🔥", "Price wars cut everyone's profit. Standing out (<b>differentiation</b>) usually beats being cheapest."]);
  if (state.rival === "ignore") out.push(["🙈", "Ignoring <b>competition</b> cost you a quarter of your customers. Always have a plan!"]);
  if (state.ethics === "plastic") out.push(["🌍", "Customers care about the planet. Cheap plastic hurt your <b>brand image</b>."]);
  if (state.marketing === "none") out.push(["📣", "People can't buy from you if they don't know you exist. <b>Marketing</b> brings customers in."]);
  if ((state.marketing === "influencer" || state.marketing === "billboard") && r.turnedAway > 0) out.push(["🤳", "Your adverts found fans you couldn't serve. Money spent for nothing!"]);
  if (out.length === 0) out.push(["🏆", "You balanced price, quality and costs brilliantly. That's what real business owners do every day!"]);
  return out.slice(0, 3);
}

function countUp(el, target) {
  const start = performance.now(), dur = 1400;
  (function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = money(target * eased);
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

// ---- Leaderboard (stored on this device only, resets each day) ----
const BOARD_KEY = "beTheBoss.scores";
function todayScores() {
  try {
    const all = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]");
    const today = new Date().toDateString();
    return all.filter(s => new Date(s.t).toDateString() === today);
  } catch { return []; }
}
function saveScore(entry) {
  try {
    const scores = todayScores();
    scores.push(entry);
    scores.sort((a, b) => b.profit - a.profit);
    localStorage.setItem(BOARD_KEY, JSON.stringify(scores.slice(0, 50)));
  } catch { /* storage blocked: leaderboard just won't show */ }
}
function renderBoard(el, me) {
  const scores = todayScores().sort((a, b) => b.profit - a.profit);
  if (!scores.length) { el.innerHTML = ""; return; }
  const top = scores.slice(0, 5);
  const myRank = me ? scores.findIndex(s => s.t === me.t) + 1 : 0;
  el.innerHTML = `<h3>🏆 Tonight's top businesses${myRank ? ` · you came #${myRank} of ${scores.length}` : ""}</h3><ol>` +
    top.map(s => `<li class="${me && s.t === me.t ? "me" : ""}"><span>${s.emoji} ${s.name}</span><b>${money(s.profit)}</b></li>`).join("") + "</ol>";
}

// ---- Idle reset for an unattended screen ----
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!$("start").classList.contains("active")) goHome();
  }, CONFIG.idleSeconds * 1000);
}
function goHome() {
  clearTimeout(feedbackTimer);
  $("feedback").classList.remove("show");
  $("question").classList.remove("answered");
  renderBoard($("startBoard"));
  show("start");
}

// ---- Wire up ----
$("kicker").textContent = CONFIG.kicker;
$("cta").textContent = CONFIG.cta;
$("startBtn").addEventListener("click", startGame);
$("againBtn").addEventListener("click", startGame);
// Ignore a fast double-tap on an option landing on the card that replaces it
$("feedback").addEventListener("click", () => { if (Date.now() - feedbackShownAt > 600) next(); });
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, resetIdle));
renderBoard($("startBoard"));
flushPending();
setInterval(flushPending, 60000);
