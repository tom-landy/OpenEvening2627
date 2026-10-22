// ---- Settings you might want to change ----
const CONFIG = {
  kicker: "Bexhill College · Open Evening",
  cta: "Want to learn how real businesses make these calls? Ask us about Business Studies!",
  idleSeconds: 90,        // return to the start screen after this long with no taps
  feedbackSeconds: 4,     // how long each consequence card shows before moving on (tap skips)
};


const money = n => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const call = (v, ...args) => (typeof v === "function" ? v(...args) : v);

// ---- The steps ----
// Product, then 2 goals, then the decisions in options.js (shared with the
// dashboard). A step with when() only appears if it applies, e.g. shipping.
const STEPS = [
  {
    key: "product", icon: "🛍️", title: "What will you sell?",
    options: Object.entries(PRODUCTS).map(([id, p]) => ({ id, emoji: p.emoji, label: p.name, sub: p.sub })),
    fb: s => `Welcome to <b>${esc(s.name)}</b>! You've spent £5,000 setting up. Now pick your goals.`,
  },
  {
    key: "objectives", icon: "🎯", title: "Pick 2 goals for your first year", pickCount: 2,
    // Only the aim is shown: what each goal does to the business is revealed at the end
    options: GOALS.map(g => ({ id: g.id, emoji: g.emoji, label: g.label, sub: `Aim: ${g.target}` })),
    fb: s => {
      const [a, b] = s.objectives.map(id => GOALS.find(g => g.id === id));
      return { emoji: "🎯", text: `Your goals: <b>${a.label}</b> and <b>${b.label}</b>. Every goal changes how you run the business, and some come with strings attached. You'll find out at the end!` };
    },
  },
  // The surprise event lands halfway through the year, after marketing
  ...DECISIONS.slice(0, DECISIONS.findIndex(d => d.key === "marketing") + 1),
  {
    key: "response", icon: "📰", isEvent: true,
    title: s => `📰 Month 6: ${call(EVENT_TEXT[s.event].title, s)}`,
    desc: s => call(EVENT_TEXT[s.event].text, s),
    options: s => Object.entries(EVENT_TEXT[s.event].responses).map(([id, o]) => ({ id, ...o })),
  },
  ...DECISIONS.slice(DECISIONS.findIndex(d => d.key === "marketing") + 1),
];
const activeSteps = () => STEPS.filter(st => !st.when || st.when(state));
const optionsOf = st => call(st.options, state);

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
  const p = state.event ? { event: state.event } : {};
  activeSteps().forEach(st => { if (state[st.key] && !(st.pickCount && state[st.key].length < st.pickCount)) p[st.key] = state[st.key]; });
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
  $("steps").innerHTML = activeSteps().map((st, i) =>
    `<li class="${i < step ? "done" : i === step ? "now" : ""}" title="${st.isEvent ? "Surprise!" : esc(st.title)}">${i < step ? stepEmoji(i) : st.icon}</li>`
  ).join("");
}
function stepEmoji(i) {
  const st = activeSteps()[i];
  const chosen = [].concat(state[st.key])[0];
  const opt = optionsOf(st).find(o => o.id === chosen);
  return opt ? opt.emoji : st.icon;
}

function renderStep() {
  renderSteps();
  const st = activeSteps()[step];
  if (st.pickCount) state[st.key] = [];
  if (st.isEvent && !state.event) state.event = pick(eventsFor(picks()));
  $("qStep").textContent = st.pickCount ? `Pick ${st.pickCount} · step ${step + 1} of ${activeSteps().length}` : `Decision ${step + 1} of ${activeSteps().length}`;
  $("qTitle").textContent = call(st.title, state);
  $("qDesc").textContent = st.desc ? call(st.desc, state) : "";
  $("question").classList.toggle("event-q", Boolean(st.isEvent));
  if (st.isEvent) showEvent();
  const opts = $("options");
  opts.classList.remove("locked");
  opts.innerHTML = "";
  const list = optionsOf(st);
  opts.classList.toggle("many", list.length > 3);
  opts.classList.toggle("lots", list.length > 8);
  opts.classList.toggle("multi", Boolean(st.pickCount));
  list.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt";
    b.style.setProperty("--i", opts.children.length);
    const sub = call(o.sub, state);
    b.innerHTML = `<span class="o-emoji">${o.emoji}</span><span class="o-text"><span class="o-label">${call(o.label, state)}</span><span class="o-sub">${sub}</span></span>`;
    b.addEventListener("click", () => choose(o, b));
    opts.appendChild(b);
  });
  if (st.key === "rival") $("rival").classList.add("show");
  // On phones the empty scene would push the 10 products off screen
  document.querySelector(".play").classList.toggle("first", step === 0);
}

function choose(opt, btn) {
  const st = activeSteps()[step];
  if (st.pickCount) {
    // Tap to pick, tap again to drop; moves on once enough are picked
    const list = state[st.key];
    const at = list.indexOf(opt.id);
    if (at >= 0) list.splice(at, 1); else list.push(opt.id);
    btn.classList.toggle("picked", at < 0);
    $("qStep").textContent = `Picked ${list.length} of ${st.pickCount}`;
    if (list.length < st.pickCount) return;
  } else {
    state[st.key] = opt.id;
    btn.classList.add("picked");
  }
  $("options").classList.add("locked");

  const r = simulate(picks());
  updateScene(st.key, r);
  updateMeters(r);
  if (st.key === "product") { setTimeout(() => askName(opt.id), 350); return; }
  const fb = feedbackFor(st, opt, r);
  setTimeout(() => showFeedback(fb), 350);
}

// ---- Naming: tap a suggestion or type one (not counted as one of the 8 decisions) ----
function askName(product) {
  const ideas = [...NAMES[product]].sort(() => Math.random() - 0.5).slice(0, 3);
  $("qTitle").textContent = `What's your ${PRODUCTS[product].name.toLowerCase()} business called?`;
  $("nIdeas").innerHTML = "";
  ideas.forEach(n => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "n-idea";
    b.textContent = n;
    b.addEventListener("click", () => useName(n));
    $("nIdeas").appendChild(b);
  });
  $("nInput").value = "";
  $("nNote").classList.remove("warn");
  $("nNote").textContent = "Keep it fun, and don't use your real name. It goes on the big screen!";
  $("question").classList.add("naming-now");
}
function useName(name) {
  state.name = name;
  $("question").classList.remove("naming-now");
  $("qTitle").textContent = STEPS[0].title;
  $("sign").textContent = name;
  $("url").textContent = "www." + (name.toLowerCase().replace(/[^a-z0-9]/g, "") || "mybusiness") + ".co.uk";
  $("nInput").blur();
  const st = STEPS[0];
  showFeedback(feedbackFor(st, st.options.find(o => o.id === state.product), simulate(picks())));
}
$("nInput").addEventListener("input", () => $("nNote").classList.remove("warn"));
$("nForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = cleanName($("nInput").value);
  if (name) return useName(name);
  $("nNote").classList.add("warn");
  $("nNote").textContent = $("nInput").value.trim().length < 2
    ? "Type a name first, or tap one of the ideas above."
    : "Hmm, we can't use that one. Try another name (letters and numbers, up to 20).";
});

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
  if (step < activeSteps().length) renderStep();
  else finish();
}

// ---- Meters ----
function resetMeters() {
  ["mCustomers", "mRep"].forEach(id => {
    const v = $(id).querySelector(".m-val");
    v.textContent = "?";
    v.classList.remove("up", "down");
  });
  $("mCustomers").querySelector(".bar i").style.width = "0";
}

// Customers and reputation only: profit stays a surprise until the results screen
function updateMeters(r) {
  const prev = lastResult;
  setMeter("mCustomers", r.customers.toLocaleString("en-GB"), prev && r.customers - prev.customers);
  $("mCustomers").querySelector(".bar i").style.width = Math.min(100, (50 * r.customers) / PRODUCTS[state.product].demand) + "%";
  $("mRep").querySelector(".m-val").textContent = starText(r.rep);
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
    $("goods").textContent = p.emoji;
    $("shop").classList.add("show");
  }
  if (key === "location") {
    $("scene").classList.add(state.location);
    $("backdrop").textContent = { street: "🏢🏬🏦🏨", mall: "🏬🛍️🏬", college: "🌳🏫🌳", market: "⛺🎪⛺", van: "🎡🎪🏟️", online: "📶🛰️📶" }[state.location];
    $("backdrop").classList.add("show");
  }
  if (key === "shipping") $("queue").innerHTML = ""; // redraw the queue with the chosen courier
  if (key === "price") {
    $("pricetag").textContent = state.price === "pwyw" ? "You choose!" : pounds(r.price);
    $("pricetag").classList.add("show");
  }
  if (key === "quality") {
    const n = { bulk: 1, budget: 1, standard: 2, mix: 2, make: 3, local: 2, fairtrade: 2, premium: 3 }[state.quality];
    const extra = { bulk: "🚢", mix: "🧰", make: "🛠️", local: "📍", fairtrade: "🌍", premium: "✨" }[state.quality];
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
      billboard: `<div class="bubble">${esc(state.name)}</div>🪧`,
      social: `<div class="bubble">#${state.name.replace(/[^A-Za-z0-9]/g, "")}</div>📸<span class="floaty">❤️</span>`,
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
  const courier = { customer: "📦", budget: "🐌", tracked: "📮", express: "⚡", green: "🚲", myself: "🚗" }[state.shipping] || "📦";
  const people = state.location === "online" ? ["📦", courier] : ["🧍", "🧍‍♀️", "🚶", "🧍‍♂️", "🚶‍♀️"];
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
  // The meters showed changes step by step; at the end just show the final numbers
  updateMeters(r);
  document.querySelectorAll(".m-val").forEach(v => v.classList.remove("up", "down"));

  $("rName").textContent = state.name + " · Year 1";
  countUp($("rProfit"), r.profit);
  $("rProfit").classList.toggle("loss", r.profit < 0);
  $("rSub").textContent = r.profit >= 0 ? "profit in your first year" : "loss in your first year";
  $("rStars").innerHTML = [1, 2, 3, 4, 5].map(i => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${0.9 + i * 0.15}s">⭐</span>`).join("");
  $("rTitle").textContent = ["", "Back to the drawing board 😬", "Just about surviving 😅", "Solid start 👍", "Rising star 🌟", "Business tycoon 🤑"][stars];

  // Money in vs money out, scaled to whichever is bigger
  const moneyIn = r.revenue + r.eventCash + r.bonus;
  const scale = Math.max(moneyIn, r.totalCosts) || 1;
  const parts = [
    ["Stock", r.costs.stock, "#f97316"],
    ["Rent", r.costs.rent, "#a855f7"],
    ["Wages", r.costs.wages, "#3b82f6"],
    ["Marketing", r.costs.marketing, "#ec4899"],
    ["Shipping", r.costs.shipping, "#14b8a6"],
    ["Fees & extras", r.costs.fees, "#eab308"],
    ["Set-up", r.costs.setup, "#94a3b8"],
    ["Surprise event", r.costs.event, "#ef4444"],
    ["Goal penalties", r.costs.penalties, "#7f1d1d"],
  ].filter(x => x[1] > 0);
  $("barIn").style.width = "0";
  $("barBonus").style.width = "0";
  $("barOut").innerHTML = parts.map(([, v, c]) => `<i style="background:${c}" data-w="${(100 * v) / scale}"></i>`).join("");
  $("valIn").textContent = money(moneyIn);
  $("valOut").textContent = money(r.totalCosts);
  $("legend").innerHTML = `<span style="--c:#15803d">Sales ${money(r.revenue)}</span>` +
    (r.bonus ? `<span style="--c:#ffc814">Goal bonuses ${money(r.bonus)}</span>` : "") +
    (r.eventCash ? `<span style="--c:#86efac">Event money ${money(r.eventCash)}</span>` : "") +
    parts.map(([n, v, c]) => `<span style="--c:${c}">${n} ${money(v)}</span>`).join("");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $("barIn").style.width = (100 * r.revenue) / scale + "%";
    $("barBonus").style.width = (100 * (r.bonus + r.eventCash)) / scale + "%";
    $("barOut").querySelectorAll("i").forEach(i => (i.style.width = i.dataset.w + "%"));
  }));

  renderEvent(r);
  renderGoals(r);
  renderImpact(r);
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
    if (data.entry) rememberMine(data.entry);
    refreshTicker();
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
  if (!data.top.length) { el.innerHTML = ""; return; }
  const me = data.entry ? data.entry.id : null;
  el.innerHTML = `<h3>🏆 Tonight's top businesses${me ? ` · you came #${data.rank} of ${data.total}` : ""}</h3><ol>` +
    data.top.map(s => `<li class="${s.id === me ? "me" : ""}"><span>${PRODUCTS[s.choices.product].emoji} ${esc(s.name)}</span><b>${money(s.profit)}</b></li>`).join("") + "</ol>";
}

// ---- Surprise event ----
// Show it on the shop scene and update the meters with the hit, before the player reacts
function showEvent() {
  const t = EVENT_TEXT[state.event];
  $("eventBadge").innerHTML = `<span>${t.emoji}</span><b>${esc(call(t.title, state))}</b>`;
  $("eventBadge").classList.add("show");
  updateMeters(simulate(picks()));
}
function renderEvent(r) {
  const t = EVENT_TEXT[state.event];
  const resp = t.responses[state.response];
  const worth = r.profit - simulate(picks(), { response: null }).profit;
  const verdict = Math.abs(worth) < 50 ? "It made almost no difference to your profit."
    : worth > 0 ? `That reaction made you <b>${money(worth)}</b> more than doing nothing.`
    : `That reaction cost you <b>${money(-worth)}</b> compared with doing nothing.`;
  $("eventCard").innerHTML = `<h3>📰 Your surprise: ${t.emoji} ${esc(call(t.title, state))}</h3>
    <p>You chose: <b>${resp.emoji} ${esc(call(resp.label, state))}</b>. ${verdict}</p>`;
  $("eventCard").className = "event-card " + (worth > 50 ? "good" : worth < -50 ? "bad" : "");
}

// ---- Goals: did they hit the targets? ----
function renderGoals(r) {
  $("goals").innerHTML = `<h3>🎯 Your goals</h3>` + r.goalResults.map(x => {
    const goal = GOALS.find(g => g.id === x.id);
    return `<div class="goal ${x.hit ? "hit" : "miss"}">
      <span class="g-emoji">${goal.emoji}</span>
      <span class="g-text"><b>${goal.label}</b><small>Target: ${goal.target}</small><small>What it did: ${goal.effect}</small></span>
      <span class="g-result">${x.hit ? `✅ ${goal.reward}` : `❌ Missed${goal.penalty ? `<small>${goal.penalty}</small>` : ""}`}</span>
    </div>`;
  }).join("");
}

// ---- Long-term impact (scores worked out by impactOf() in model.js) ----
function renderImpact(r) {
  const im = r.impact;
  const profit = r.profit;
  const both = im.planet + im.local;
  const outlook =
    both >= 8 && profit < 0 ? "The town loves you, but you're losing money. Sort out your costs and year two could be great." :
    both >= 8 ? "Customers and the town love you. You're set up for a strong year two!" :
    both <= 4 && profit > 0 ? "Profit now, problems later. Expect complaints, bad press and customers drifting away." :
    both <= 4 ? "Losing money and hurting the area: time for a rethink." :
    "Not bad! A few greener or more local choices would win you more loyal customers.";
  const leaves = (n, on, off) => on.repeat(n) + `<i>${off.repeat(5 - n)}</i>`;
  $("impact").innerHTML = `
    <h3>🔮 Your long-term impact</h3>
    <div class="im-row"><span>🌍 Planet</span><span class="im-score">${leaves(im.planet, "🌳", "🌳")}</span></div>
    <div class="im-row"><span>🏘️ Local area</span><span class="im-score">${leaves(im.local, "🏠", "🏠")}</span></div>
    ${im.best ? `<p class="im-note good">👍 ${im.best.text}</p>` : ""}
    ${im.worst ? `<p class="im-note bad">👎 ${im.worst.text}</p>` : ""}
    <p class="im-outlook">${outlook}</p>`;
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
  if (state.location === "online" && r.perOrder > margin && margin > 0) out.push(["📦", "Delivery cost more than you made on each sale. Cheap products and postage don't mix: think about <b>unit costs</b>."]);
  else if (state.location === "online") out.push(["💻", "Online saved on rent, but <b>platform fees</b> and delivery ate into every sale."]);
  if (state.quality === "make" && r.turnedAway > 0) out.push(["🛠️", "Making it yourself was cheap, but you couldn't make enough. That's a <b>production capacity</b> problem."]);
  const missed = r.goalResults.filter(x => !x.hit).length;
  if (missed === 2) out.push(["🎯", "You missed both goals. Good businesses pick <b>objectives</b> that fit their plan."]);
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

// ---- Start screen leaderboard: tonight's from the server, this device's if offline ----
const RESET_KEY = "beTheBoss.resetAt";
async function showStartBoard() {
  try {
    const res = await fetch("api/top", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    forgetBefore(data.resetAt);
    renderServerBoard($("startBoard"), data);
  } catch {
    renderBoard($("startBoard"));
  }
}
// After a reset, drop this device's old scores and unsent games too
function forgetBefore(resetAt) {
  try {
    if (!resetAt || resetAt <= Number(localStorage.getItem(RESET_KEY) || 0)) return;
    localStorage.setItem(RESET_KEY, String(resetAt));
    localStorage.setItem(BOARD_KEY, JSON.stringify(todayScores().filter(s => s.t > resetAt)));
    savePending(loadPending().filter(p => p.t > resetAt));
    saveMine(loadMine().filter(m => m.t > resetAt));
  } catch { }
}

// ---- Games this device played, so they survive a server restart ----
// The server keeps results in memory. If it restarts (a redeploy, or Render
// waking it), every device sends back its own games from tonight.
const MINE_KEY = "beTheBoss.mine", BOOT_KEY = "beTheBoss.boot";
function loadMine() {
  try { return JSON.parse(localStorage.getItem(MINE_KEY) || "[]").filter(m => m.t > Date.now() - 18 * 3600000); } catch { return []; }
}
function saveMine(list) {
  try { localStorage.setItem(MINE_KEY, JSON.stringify(list.slice(-100))); } catch { }
}
function rememberMine(e) {
  saveMine([...loadMine().filter(m => m.id !== e.id), { id: e.id, t: e.t, name: e.name, choices: e.choices }]);
}
async function checkRestart(boot) {
  let known = null;
  try { known = localStorage.getItem(BOOT_KEY); localStorage.setItem(BOOT_KEY, boot); } catch { }
  if (!known || known === boot) return false;
  const mine = loadMine();
  if (!mine.length) return false;
  await fetch("api/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: mine }) }).catch(() => null);
  return true;
}

// ---- Ticker along the bottom: facts from tonight's games (insights.js) ----
async function refreshTicker() {
  try {
    const res = await fetch("api/results?after=0", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    // Server restarted? Hand back this device's games, then fetch again
    if (data.boot && (await checkRestart(data.boot))) return refreshTicker();
    const facts = buildInsights(data.results);
    const items = facts.length ? facts : TICKER_TIPS;
    tickerItems = items;
    $("ticker").hidden = false;
    document.body.classList.add("has-ticker");
    if (lessMotion.matches) return showTickerItem();
    // Two copies side by side so the scroll loops without a gap
    const row = items.map(t => `<span>${t}</span>`).join("");
    $("tickerTrack").innerHTML = row + row;
    $("tickerTrack").style.setProperty("--ticker-time", Math.max(30, items.length * 9) + "s");
  } catch { /* offline: keep whatever is showing */ }
}

// Computers set to reduce motion (often the default on managed PCs) get one
// fact at a time, changing every few seconds, instead of a scrolling line
const lessMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let tickerItems = [], tickerIndex = 0;
function showTickerItem() {
  if (!tickerItems.length) return;
  tickerIndex = (tickerIndex + 1) % tickerItems.length;
  $("tickerTrack").innerHTML = `<span class="one">${tickerItems[tickerIndex]}</span>`;
}
setInterval(() => { if (lessMotion.matches) showTickerItem(); }, 5000);
lessMotion.addEventListener?.("change", refreshTicker);

// ---- Fallback leaderboard (stored on this device only, resets each day) ----
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
    top.map(s => `<li class="${me && s.t === me.t ? "me" : ""}"><span>${s.emoji} ${esc(s.name)}</span><b>${money(s.profit)}</b></li>`).join("") + "</ol>";
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
  $("question").classList.remove("answered", "naming-now");
  showStartBoard();
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
showStartBoard();
flushPending();
refreshTicker();
setInterval(refreshTicker, 60000);
setInterval(flushPending, 60000);
