// ---- Settings you might want to change ----
const CONFIG = {
  kicker: "Business Studies · Open Evening",
  cta: "Want to learn how real businesses make these calls? Ask us about Business Studies!",
  idleSeconds: 90,        // return to the start screen after this long with no taps
  feedbackSeconds: 4,     // how long each consequence card shows before moving on (tap skips)
};

const NAMES = {
  bubble: ["Bubble Trouble", "Boba Bros", "Tea-riffic", "Pop & Sip", "Pearl Jam"],
  burger: ["Bun Intended", "Patty Wagon", "Grill Seekers", "Burger Boss", "Stack Attack"],
  phone:  ["Case Closed", "Cover Story", "Phone Home", "Snap Case", "Shell Shock"],
};

const money = n => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const pounds = n => "£" + n.toFixed(2);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---- The 8 decisions ----
// Each option's `sub` and `feedback` can be a function of the game state so the
// text matches what the player is selling.
const STEPS = [
  {
    key: "product", icon: "🛍️", title: "What will you sell?",
    options: [
      { id: "bubble", emoji: "🧋", label: "Bubble Tea", sub: "Cheap to make, loads of fans" },
      { id: "burger", emoji: "🍔", label: "Burgers", sub: "Everyone's hungry, but ingredients cost more" },
      { id: "phone",  emoji: "📱", label: "Phone Cases", sub: "Fewer buyers, but a big mark-up" },
    ],
    feedback: (s) => ({ emoji: PRODUCTS[s.product].emoji, text: `Welcome to <b>${s.name}</b>! You've spent £5,000 setting up. Now let's find a home for it.` }),
  },
  {
    key: "location", icon: "📍", title: "Where will you set up?",
    options: [
      { id: "street",  emoji: "🏙️", label: "High street", sub: "Super busy, but rent is £2,000 a month" },
      { id: "college", emoji: "🏫", label: "Next to a college", sub: "Steady crowd, rent is £800 a month" },
      { id: "online",  emoji: "💻", label: "Online only", sub: "Tiny rent, but apps take 15% of every sale" },
    ],
    feedback: (s) => ({
      street:  { emoji: "🏙️", text: "Thousands walk past every day. That rent is going to hurt if they don't come in." },
      college: { emoji: "🏫", text: "Hungry students on your doorstep, and rent you can afford." },
      online:  { emoji: "💻", text: "Hardly any rent! But nobody walks past a website. People need to find you." },
    }[s.location]),
  },
  {
    key: "price", icon: "💷", title: "How much will you charge?",
    options: [
      { id: "low",  emoji: "🏷️", label: "Bargain", sub: (s) => `${pounds(PRODUCTS[s.product].prices.low)} each. Crowds love a deal` },
      { id: "mid",  emoji: "⚖️", label: "Fair price", sub: (s) => `${pounds(PRODUCTS[s.product].prices.mid)} each. Same as most places` },
      { id: "high", emoji: "💎", label: "Premium", sub: (s) => `${pounds(PRODUCTS[s.product].prices.high)} each. Fewer buyers, more profit each` },
    ],
    feedback: (s, r) => ({
      low:  { emoji: "🏷️", text: `Cheap! More customers, but you only keep ${pounds(r.price - r.unitCost)} from each sale.` },
      mid:  { emoji: "⚖️", text: `A fair price. You keep ${pounds(r.price - r.unitCost)} from each sale after paying for stock.` },
      high: { emoji: "💎", text: `You keep ${pounds(r.price - r.unitCost)} from each sale. Customers will expect it to be amazing.` },
    }[s.price]),
  },
  {
    key: "quality", icon: "🥇", title: "Which supplier will you use?",
    options: [
      { id: "budget",   emoji: "📦", label: "Budget", sub: "Cheapest stock, so-so quality" },
      { id: "standard", emoji: "👍", label: "Standard", sub: "Decent stuff, normal price" },
      { id: "premium",  emoji: "✨", label: "Premium", sub: "Top quality, costs 40% more" },
    ],
    feedback: (s, r) => {
      if (r.ripOff) return { emoji: "😠", text: "Premium prices for budget stuff? Customers feel ripped off. Bad reviews incoming!" };
      return {
        budget:   { emoji: "📦", text: "Cheap stock saves money, but some customers won't come back." },
        standard: { emoji: "👍", text: "Solid quality. Nobody's complaining." },
        premium:  { emoji: "✨", text: s.price === "high" ? "Premium price, premium product. People happily pay for quality!" : "Delicious! Word is spreading, but each one costs you more to make." },
      }[s.quality];
    },
  },
  {
    key: "staff", icon: "🧑‍🍳", title: "Who's working in your business?",
    options: [
      { id: "solo", emoji: "🙋", label: "Just me", sub: "No wages, but you can only serve so many" },
      { id: "part", emoji: "👯", label: "Me + a part-timer", sub: "£900 a month in wages" },
      { id: "team", emoji: "👨‍👩‍👧‍👦", label: "A full team", sub: "£2,800 a month, serve loads of people" },
    ],
    feedback: (s, r) => {
      if (r.turnedAway > 0) return { emoji: "😫", text: `Queue out the door! You're turning away <b>${r.turnedAway.toLocaleString()}</b> customers a month.` };
      if (s.staff === "team" && r.customers < r.capacity * 0.5) return { emoji: "🥱", text: "Your team is standing around. You pay wages even when it's quiet." };
      return { emoji: "😊", text: "Just the right number of people to serve everyone who comes in." };
    },
  },
  {
    key: "marketing", icon: "📣", title: "How will people hear about you?",
    options: [
      { id: "none",       emoji: "💬", label: "Word of mouth", sub: "Free! Hope people tell their friends" },
      { id: "social",     emoji: "📸", label: "Social media", sub: "Ads and posts, £400 a month" },
      { id: "influencer", emoji: "🤳", label: "Pay an influencer", sub: "Huge reach, £1,200 a month" },
    ],
    feedback: (s, r) => ({
      none:       { emoji: "💬", text: s.location === "online" ? "Online with no adverts? Hardly anyone can find you." : "Free is nice, but lots of people still don't know you exist." },
      social:     { emoji: "📸", text: "Your posts are getting likes and shares. New faces every week!" },
      influencer: { emoji: "🤳", text: r.turnedAway > 0 ? "Thousands of fans want in, but you can't serve them all!" : "Your video went viral! Is the extra cost worth it?" },
    }[s.marketing]),
  },
  {
    key: "ethics", icon: "🌍", title: "How will you do the right thing?",
    options: [
      { id: "plastic", emoji: "🥤", label: "Cheapest packaging", sub: "Plastic. Costs nothing extra" },
      { id: "recycle", emoji: "♻️", label: "Recyclable packaging", sub: "15p extra on every sale" },
      { id: "charity", emoji: "💚", label: "Help a local charity", sub: "Give away 5% of your sales" },
    ],
    feedback: (s) => ({
      plastic: { emoji: "🥤", text: "Someone posted your plastic waste online. Your reputation took a hit." },
      recycle: { emoji: "♻️", text: "Customers notice you care about the planet. Good for your reputation!" },
      charity: { emoji: "💚", text: "The local paper wrote about you. People love a business that gives back!" },
    }[s.ethics]),
  },
  {
    key: "rival", icon: "🚨", title: "🚨 A rival just opened nearby! What now?",
    options: [
      { id: "pricewar", emoji: "🔥", label: "Price war", sub: "Cut your prices by 15%" },
      { id: "newidea",  emoji: "🚀", label: "Launch something new", sub: "Costs £3,000, gives people a reason to choose you" },
      { id: "loyalty",  emoji: "💳", label: "Loyalty cards", sub: "Regulars get 5% off, so they stay" },
    ],
    feedback: (s) => ({
      pricewar: { emoji: "🔥", text: "You kept your customers, but now you earn less on every sale." },
      newidea:  { emoji: "🚀", text: "Your new idea is a hit! People are choosing you over the rival." },
      loyalty:  { emoji: "💳", text: "Your regulars are sticking with you. Loyal customers are gold." },
    }[s.rival]),
  },
];

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
  st.options.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt";
    const sub = typeof o.sub === "function" ? o.sub(state) : o.sub;
    b.innerHTML = `<span class="o-emoji">${o.emoji}</span><span class="o-text"><span class="o-label">${o.label}</span><span class="o-sub">${sub}</span></span>`;
    b.addEventListener("click", () => choose(o, b));
    opts.appendChild(b);
  });
  if (st.key === "rival") $("rival").classList.add("show");
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
  const fb = st.feedback(state, r);
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
  $("mCustomers").querySelector(".bar i").style.width = Math.min(100, r.customers / 60) + "%";
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
    $("backdrop").textContent = { street: "🏢🏬🏦🏨", college: "🌳🏫🌳", online: "📶🛰️📶" }[state.location];
    $("backdrop").classList.add("show");
  }
  if (key === "price") {
    $("pricetag").textContent = pounds(p.prices[state.price]);
    $("pricetag").classList.add("show");
  }
  if (key === "quality") {
    const n = { budget: 1, standard: 2, premium: 3 }[state.quality];
    $("goods").innerHTML = p.emoji.repeat(n) + (state.quality === "premium" ? '<span class="spark">✨</span>' : "");
  }
  if (key === "staff") {
    const who = { solo: ["🧑‍🍳"], part: ["🧑‍🍳", "👩‍🍳"], team: ["🧑‍🍳", "👩‍🍳", "👨‍🍳"] }[state.staff];
    $("staff").innerHTML = who.map(w => `<span>${w}</span>`).join("");
  }
  if (key === "marketing") {
    $("promo").innerHTML = {
      none: `<div class="bubble">"Have you tried it?"</div>💬`,
      social: `<div class="bubble">#${state.name.replace(/[^A-Za-z]/g, "")}</div>📸<span class="floaty">❤️</span>`,
      influencer: `<div class="bubble">1.2M followers!</div>🤳<span class="floaty">⭐</span>`,
    }[state.marketing];
    $("promo").classList.add("show");
  }
  if (key === "ethics") {
    $("eco").textContent = { plastic: "🥤", recycle: "♻️", charity: "💚" }[state.ethics];
    $("eco").classList.add("show");
  }
  if (key === "rival") {
    $("response").textContent = { pricewar: "🔥 15% OFF", newidea: "🚀 NEW!", loyalty: "💳 Loyalty" }[state.rival];
    $("response").classList.add("show");
    if (state.rival === "pricewar") $("pricetag").textContent = pounds(r.price);
  }
  renderQueue(r);
}

function renderQueue(r) {
  if (!state.location) return;
  const n = Math.max(0, Math.min(12, Math.round(r.customers / 450)));
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
}

function lessons(r) {
  const out = [];
  if (r.turnedAway > 0) out.push(["😫", `You turned away ${r.turnedAway.toLocaleString()} customers a month. More staff would have earned you more. That's called <b>capacity</b>.`]);
  if (state.staff === "team" && r.customers < r.capacity * 0.5) out.push(["🥱", "Your team was often standing around. Wages are a <b>fixed cost</b>: you pay them even when it's quiet."]);
  if (r.ripOff) out.push(["😠", "Premium price with budget quality made customers angry. <b>Reputation</b> matters!"]);
  if (state.price === "low") out.push(["🏷️", "Bargain prices bring crowds, but your <b>profit margin</b> on each sale was tiny."]);
  if (state.location === "online") out.push(["💻", "Online saved on rent, but <b>platform fees</b> took 15% of everything you sold."]);
  if (state.location === "street" && r.profit < 0) out.push(["🏙️", "High street rent is a big <b>fixed cost</b>. You need lots of sales just to cover it."]);
  if (state.rival === "pricewar") out.push(["🔥", "Price wars cut everyone's profit. Standing out (<b>differentiation</b>) usually beats being cheapest."]);
  if (state.ethics === "plastic") out.push(["🌍", "Customers care about the planet. Cheap plastic hurt your <b>brand image</b>."]);
  if (state.marketing === "none") out.push(["📣", "People can't buy from you if they don't know you exist. <b>Marketing</b> brings customers in."]);
  if (state.marketing === "influencer" && r.turnedAway > 0) out.push(["🤳", "Your influencer found fans you couldn't serve. Money spent for nothing!"]);
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
