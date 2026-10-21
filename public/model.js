// The business model behind the game. All numbers are per month unless noted.
// Kept separate from the UI so it can be tuned (and tested with node sim.js).

// unit: what one sale is. staff: who appears in the shop window.
const FOOD = ["🧑‍🍳", "👩‍🍳", "👨‍🍳"], SHOP = ["🧑‍💼", "👩‍💼", "👨‍💼"];
const PRODUCTS = {
  bubble:   { name: "Bubble Tea",      emoji: "🧋", demand: 2800, unitCost: 1.2, prices: { low: 2.5, mid: 3.8, high: 5.5 },  colour: "#ff7eb6", sub: "Cheap to make, loads of fans", staff: FOOD },
  burger:   { name: "Burgers",         emoji: "🍔", demand: 1800, unitCost: 2.8, prices: { low: 5, mid: 6.5, high: 9 },      colour: "#ffb347", sub: "Everyone's hungry, pricey ingredients", staff: FOOD },
  phone:    { name: "Phone Cases",     emoji: "📱", demand: 650,  unitCost: 2,   prices: { low: 5, mid: 9, high: 15 },       colour: "#7ec8ff", sub: "Fewer buyers, big mark-up", staff: SHOP },
  pizza:    { name: "Pizza",           emoji: "🍕", demand: 850,  unitCost: 3,   prices: { low: 6, mid: 9, high: 13 },       colour: "#ff6b57", sub: "Big orders, hot ovens", staff: FOOD },
  cupcake:  { name: "Cupcakes",        emoji: "🧁", demand: 3000, unitCost: 0.9, prices: { low: 2.2, mid: 3.4, high: 5 },      colour: "#c58cff", sub: "Small treats, sold by the dozen", staff: FOOD },
  icecream: { name: "Ice Cream",       emoji: "🍦", demand: 3000, unitCost: 0.8, prices: { low: 2.2, mid: 3.2, high: 4.8 },  colour: "#7fe0d0", sub: "Everyone loves it, mostly in summer", staff: FOOD },
  trainers: { name: "Custom Trainers", emoji: "👟", demand: 100,  unitCost: 35,  prices: { low: 60, mid: 85, high: 130 },    colour: "#ff9f43", sub: "Few sales, huge price tag", staff: SHOP },
  tshirt:   { name: "Printed T-shirts", emoji: "👕", demand: 400, unitCost: 6,   prices: { low: 12, mid: 18, high: 28 },     colour: "#5fa8ff", sub: "Design it once, print it lots", staff: SHOP },
  gaming:   { name: "Gaming Café",     emoji: "🎮", demand: 1200, unitCost: 0.8, prices: { low: 3, mid: 5, high: 8 },        colour: "#8f7bff", sub: "Sell hours of play, not things", staff: SHOP, unit: "an hour" },
  plants:   { name: "House Plants",    emoji: "🪴", demand: 700,  unitCost: 4,   prices: { low: 7, mid: 11, high: 18 },      colour: "#6fd36f", sub: "Calm customers, careful stock", staff: SHOP },
  resell:   { name: "Second-hand Reseller", emoji: "👚", demand: 580, unitCost: 5, prices: { low: 9, mid: 14, high: 22 },  colour: "#f4a6c8", sub: "Buy pre-loved clothes cheap, sell them on", staff: SHOP },
  dogs:     { name: "Posh Dog Treats", emoji: "🐶", demand: 650, unitCost: 2, prices: { low: 6, mid: 9, high: 14 },  colour: "#c8935a", sub: "A small niche, but dog owners are loyal", staff: FOOD },
};

// Business names are picked at random from these lists, so players never type anything.
const NAMES = {
  bubble:   ["Bubble Trouble", "Boba Bros", "Tea-riffic", "Pop & Sip", "Pearl Jam"],
  burger:   ["Bun Intended", "Patty Wagon", "Grill Seekers", "Burger Boss", "Stack Attack"],
  phone:    ["Case Closed", "Cover Story", "Phone Home", "Snap Case", "Shell Shock"],
  pizza:    ["Slice Slice Baby", "Crust Me", "Dough Joe", "Cheesy Does It", "Pizza the Action"],
  cupcake:  ["Cake My Day", "Frost Bite", "Whisk Takers", "Batter Up", "Sweet Spot"],
  icecream: ["Scoop There It Is", "Brain Freeze", "Cone Zone", "Sundae Funday", "Chill Out"],
  trainers: ["Sole Mates", "Kicks & Co", "Fresh Steps", "Lace Up", "Heel Good"],
  tshirt:   ["Tee-rific", "Fresh Prints", "Cotton On", "Top Notch", "Print Club"],
  gaming:   ["Level Up", "Press Start", "Game On", "Pixel Palace", "Respawn"],
  plants:   ["Leaf It Out", "Grow For It", "Plant Party", "Pot Luck", "Fern Gully"],
  resell:   ["Second Wind", "Thrift Shift", "Pre-Loved Club", "Rewear Room", "Vintage Vault"],
  dogs:     ["Barking Mad", "Good Boy Bakes", "Paws & Treats", "Bone Appetit", "Woof Bakery"],
};

// ---- Player-typed business names ----
// Names show on a public screen, so they're kept short and checked for rude
// words. Words in BLOCK_ANY are caught anywhere in the name; BLOCK_WORD only as
// whole words, so "Sussex" or "Grape Escape" aren't caught by mistake.
const BLOCK_ANY = ["fuck", "fuk", "shit", "cunt", "bitch", "wank", "twat", "nigg", "fagg", "retard", "whore", "slut", "nazi", "hitler", "porn", "dildo", "bollock", "spastic", "pussy", "tosser", "piss"];
const BLOCK_WORD = ["ass", "arse", "arsehole", "dick", "dicks", "cock", "cocks", "tit", "tits", "boob", "boobs", "sex", "sexy", "rape", "fag", "fags", "paki", "spaz", "knob", "prick", "nonce", "kys", "kill", "nob", "jizz", "cum", "milf", "damn", "crap", "bum", "bums", "poo", "pee", "wee"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" };

// Returns a tidy name, or null if it can't be used
function cleanName(raw) {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[A-Za-z0-9 &'!.,-]+$/.test(name)) return null;
  if (/\d{5,}/.test(name.replace(/\s/g, ""))) return null; // looks like a phone number
  const plain = name.toLowerCase().replace(/[013457 8@$!]/g, ch => LEET[ch] || ch).replace(/[^a-z ]/g, "");
  const words = plain.split(" ").filter(Boolean);
  // "f u c k" style spacing: also check with the gaps removed
  const squashed = words.filter(w => w.length === 1).length >= 3 ? plain.replace(/ /g, "") : "";
  if (BLOCK_ANY.some(b => plain.includes(b) || squashed.includes(b))) return null;
  if (words.some(w => BLOCK_WORD.includes(w)) || (squashed && BLOCK_WORD.includes(squashed))) return null;
  return name;
}

// Every option, with the defaults filled in, so simulate() never needs special cases.
// Fields left out of an option fall back to the neutral values in fill().
const LOCATIONS = fill({
  street:  { footfall: 1.4, rent: 2000 },
  mall:    { footfall: 1.7, rent: 3200 },
  college: { footfall: 1.0, rent: 800 },
  market:  { footfall: 0.75, rent: 250 },
  van:     { footfall: 0.9, rent: 600, marketingBoost: 1.3 },
  online:  { footfall: 1.0, rent: 100, fee: 0.1, marketingBoost: 1.8 },
}, { fee: 0, marketingBoost: 1 });

// of: which of the product's three prices it starts from. premiumDemand: used
// instead of demand when the quality really is premium.
const PRICES = fill({
  rock:   { of: "low",  mult: 0.8,  demand: 2.2 },
  low:    { of: "low",  mult: 1,    demand: 1.65 },
  pwyw:   { of: "mid",  mult: 0.8,  demand: 1.35, rep: 0.5 },
  mid:    { of: "mid",  mult: 1,    demand: 1 },
  high:   { of: "high", mult: 1,    demand: 0.45, premiumDemand: 0.75 },
  luxury: { of: "high", mult: 1.6,  demand: 0.12, premiumDemand: 0.3 },
}, { rep: 0 });
const PRICE_DEMAND = PRICES; // older name, kept for anything still using it

const QUALITY = fill({
  bulk:      { cost: 0.55, demand: 0.8,  rep: -1.5, capacity: 0.85, cheap: true },
  budget:    { cost: 0.7,  demand: 0.85, rep: -1, cheap: true },
  standard:  { cost: 1,    demand: 1,    rep: 0 },
  local:     { cost: 1.15, demand: 1.08, rep: 0.75 },
  fairtrade: { cost: 1.25, demand: 1,    rep: 1, posh: true },
  premium:   { cost: 1.4,  demand: 1.15, rep: 1, posh: true },
  // Making it yourself: cheap materials, but equipment up front and your time is limited
  mix:       { cost: 0.8,  demand: 1.02, rep: 0.25, capacity: 0.85, oneOff: 1500 },
  make:      { cost: 0.7,  demand: 1.05, rep: 0.5,  capacity: 0.65, oneOff: 4000 },
}, { capacity: 1, cheap: false, posh: false, oneOff: 0 });

// Only asked when selling online. perOrder: what each parcel costs you. Cheap
// things are bought several at a time, so one parcel holds about £10 of stock.
const SHIPPING = fill({
  customer: { perOrder: 0,   demand: 0.7 },
  budget:   { perOrder: 1.5, rep: -0.75 },
  tracked:  { perOrder: 2.5 },
  express:  { perOrder: 3.8, rep: 0.75, demand: 1.15 },
  green:    { perOrder: 3,   rep: 0.5 },
  myself:   { perOrder: 0.8, rep: 0.25, capacity: 0.6 },
}, { perOrder: 0, rep: 0, demand: 1, capacity: 1 });

// Pick 2 at the start. The effect runs all year; hitting the target pays a bonus.
// target(choices, result before bonuses) -> true/false
const OBJECTIVES = fill({
  profit:    { unitCost: 0.95, rep: -0.25, reward: 2000, target: (c, r) => r.profit >= 30000 },
  survive:   { marketing: 0.8, demand: 0.97, reward: 1000, target: (c, r) => r.profit >= 0 },
  growth:    { demand: 1.1, monthly: 200, reward: 1500, target: (c, r) => r.customers >= 1.5 * PRODUCTS[c.product].demand },
  stars:     { rep: 0.5, monthly: 150, reward: 1000, target: (c, r) => r.rep >= 4.5 },
  green:     { unitCost: 1.03, rep: 0.25, reward: 2000, target: (c, r) => r.impact.planet >= 4 },
  community: { monthly: 100, rep: 0.25, reward: 1500, target: (c, r) => r.impact.local >= 5 },
  rival:     { price: 0.95, demand: 1.08, reward: 1000, target: c => Boolean(c.rival) && RIVAL[c.rival].demand >= 1 },
  jobs:      { wage: 1.1, reward: 1500, target: c => ["apprentice", "part", "team"].includes(c.staff) },
  luxury:    { price: 1.05, demand: 0.95, reward: 2000, target: c => ["high", "luxury"].includes(c.price) && QUALITY[c.quality].posh },
  innovate:  { oneOff: 2000, demand: 1.08, reward: 1500, target: c => c.rival === "newidea" || c.quality === "make" },
}, { unitCost: 1, rep: 0, marketing: 1, demand: 1, monthly: 0, price: 1, wage: 1, oneOff: 0, reward: 0 });

// ---- Long-term impact on the planet and the local area ----
// Doesn't change profit directly (only through the green/community goals).
// [planet, local, what it means]. Choices not listed are neutral.
const IMPACT = {
  location: {
    market: [1, 2, "Your market stall brings shoppers into the town centre."],
    college: [0, 1, null],
    street: [0, 1, null],
    van: [-1, 1, "Your van burns fuel driving between events."],
    online: [-1, -1, "Online orders mean lots of delivery vans, and no shop in town."],
  },
  shipping: {
    budget: [-1, 0, null],
    express: [-1, 0, "Next-day delivery means half-empty vans racing about."],
    green: [2, 0, "Your carbon-neutral courier cancels out its emissions."],
    myself: [-1, 1, null],
  },
  quality: {
    bulk: [-2, -2, "Bulk stock shipped from abroad means transport pollution and no local jobs."],
    budget: [-1, 0, "Cheap stock tends to be thrown away sooner."],
    local: [1, 2, "Buying local keeps money and jobs in the area, with fewer miles travelled."],
    fairtrade: [1, 0, "Fairtrade means the people who make your stock are paid fairly."],
    make: [1, 1, "Making it yourself cuts out shipping and keeps skills in town."],
    mix: [0, 1, null],
  },
  staff: {
    family: [0, 1, null],
    part: [0, 1, null],
    apprentice: [0, 2, "Your apprentice gets a start in their career, right here in town."],
    team: [0, 2, "You created proper local jobs."],
    robots: [0, -2, "Machines instead of people means fewer local jobs."],
  },
  marketing: {
    flyers: [-1, 0, "Most flyers end up in the bin."],
    billboard: [-1, 0, null],
    samples: [0, 1, null],
  },
  ethics: {
    plastic: [-2, -1, "Your plastic packaging ends up as litter and landfill."],
    recycle: [2, 0, "Recyclable packaging keeps rubbish out of landfill."],
    charity: [0, 2, "Your donations help a local charity all year round."],
    wage: [0, 2, "Paying a real living wage helps local families."],
    solar: [2, 0, "Solar panels cut your carbon footprint for years to come."],
    volunteer: [0, 2, "Volunteering makes the whole town better off."],
  },
};

// Scores out of 5, plus the best and worst things the player did
function impactOf(c) {
  let planet = 0, local = 0;
  const notes = [];
  for (const [key, table] of Object.entries(IMPACT)) {
    if (key === "shipping" && c.location !== "online") continue;
    const hit = table[c[key]];
    if (!hit) continue;
    planet += hit[0];
    local += hit[1];
    if (hit[2]) notes.push({ score: hit[0] + hit[1], text: hit[2] });
  }
  const rate = s => Math.max(1, Math.min(5, Math.round(3 + s / 2)));
  notes.sort((a, b) => a.score - b.score);
  const worst = notes.length && notes[0].score < 0 ? notes[0] : null;
  const best = notes.length && notes[notes.length - 1].score > 0 ? notes[notes.length - 1] : null;
  return { planet: rate(planet), local: rate(local), worst, best };
}

const STAFF = fill({
  solo:       { capacity: 1500, wages: 0,    rep: -0.5 },
  family:     { capacity: 2200, wages: 200,  rep: -0.25 },
  apprentice: { capacity: 2400, wages: 650,  rep: 0.5 },
  part:       { capacity: 3000, wages: 900,  rep: 0 },
  team:       { capacity: 6000, wages: 2500, rep: 0.5 },
  robots:     { capacity: 5000, wages: 1400, rep: -0.5 },
}, {});

const MARKETING = fill({
  none:       { lift: 1,    cost: 0 },
  flyers:     { lift: 1.1,  cost: 150 },
  samples:    { lift: 1.2,  cost: 450, rep: 0.5 },
  social:     { lift: 1.3,  cost: 400 },
  influencer: { lift: 1.6,  cost: 1200 },
  billboard:  { lift: 1.5,  cost: 1600 },
}, { rep: 0 });

const ETHICS = fill({
  plastic:   { rep: -1 },
  recycle:   { extraUnit: 0.15, rep: 0.5 },
  charity:   { share: 0.05, rep: 1 },
  wage:      { wageFactor: 1.2, rep: 1, capacity: 1.05 },
  solar:     { oneOff: 4000, rep: 0.75 },
  volunteer: { capacity: 0.92, rep: 1 },
}, { extraUnit: 0, rep: 0, share: 0, wageFactor: 1, oneOff: 0, capacity: 1 });

const RIVAL = fill({
  pricewar:  { demand: 1.05, priceCut: 0.85 },
  newidea:   { demand: 1.1, oneOff: 3000, rep: 0.5 },
  loyalty:   { share: 0.05, rep: 0.5 },
  service:   { demand: 0.95, oneOff: 1500, rep: 1 },
  advertise: { demand: 1.08, monthly: 800 },
  ignore:    { demand: 0.75 },
}, { demand: 1, priceCut: 1, oneOff: 0, share: 0, rep: 0, monthly: 0 });

function fill(table, defaults) {
  for (const k in table) table[k] = Object.assign({}, defaults, table[k]);
  return table;
}

const STARTUP_COST = 5000; // one-off: fit-out, equipment, website

// Fill gaps with middle options so the live meters show a sensible projection
// before every decision has been made.
const DEFAULTS = { product: "bubble", location: "college", price: "mid", quality: "standard", staff: "part", marketing: "none", shipping: "tracked", objectives: [] };
const NEUTRAL_ETHICS = { extraUnit: 0, rep: 0, share: 0, wageFactor: 1, oneOff: 0, capacity: 1 };
const NO_SHIPPING = { perOrder: 0, rep: 0, demand: 1, capacity: 1 };
const NEUTRAL_RIVAL = { demand: 1, priceCut: 1, oneOff: 0, share: 0, rep: 0, monthly: 0 };

function simulate(picked) {
  const c = Object.assign({}, DEFAULTS, picked);
  const p = PRODUCTS[c.product];
  const loc = LOCATIONS[c.location];
  const pr = PRICES[c.price];
  const q = QUALITY[c.quality];
  const st = STAFF[c.staff];
  const m = MARKETING[c.marketing];
  const eth = c.ethics ? ETHICS[c.ethics] : NEUTRAL_ETHICS;
  const rv = c.rival ? RIVAL[c.rival] : NEUTRAL_RIVAL;
  const sh = c.location === "online" ? SHIPPING[c.shipping] : NO_SHIPPING;
  // Two goals combine by multiplying (or adding, for money and reputation)
  const goals = (c.objectives || []).map(id => OBJECTIVES[id]).filter(Boolean);
  const g = goals.reduce((a, o) => ({
    unitCost: a.unitCost * o.unitCost, rep: a.rep + o.rep, marketing: a.marketing * o.marketing, demand: a.demand * o.demand,
    monthly: a.monthly + o.monthly, price: a.price * o.price, wage: a.wage * o.wage, oneOff: a.oneOff + o.oneOff,
  }), { unitCost: 1, rep: 0, marketing: 1, demand: 1, monthly: 0, price: 1, wage: 1, oneOff: 0 });

  // Reputation out of 5, starts at 3
  let rep = 3 + pr.rep + q.rep + st.rep + m.rep + eth.rep + rv.rep + sh.rep + g.rep;
  const ripOff = (c.price === "high" || c.price === "luxury") && q.cheap;
  if (ripOff) rep -= 1.5;
  rep = Math.max(1, Math.min(5, rep));
  const repFactor = 0.4 + 0.2 * rep;

  // Premium prices hurt less when the product really is premium
  const priceDemand = q.posh && pr.premiumDemand ? pr.premiumDemand : pr.demand;
  const lift = 1 + (m.lift - 1) * loc.marketingBoost;

  const demand = Math.round(p.demand * loc.footfall * priceDemand * q.demand * lift * repFactor * rv.demand * sh.demand * g.demand);
  const capacity = Math.round(st.capacity * q.capacity * eth.capacity * sh.capacity);
  const customers = Math.min(demand, capacity);
  const turnedAway = Math.max(0, demand - capacity);

  const price = p.prices[pr.of] * pr.mult * rv.priceCut * g.price;
  const unitCost = p.unitCost * q.cost * g.unitCost + eth.extraUnit;
  const basket = Math.max(1, 10 / p.prices.mid); // items per parcel

  const revenue = customers * price * 12;
  const costs = {
    stock: customers * unitCost * 12,
    rent: loc.rent * 12,
    wages: st.wages * (c.staff === "robots" ? 1 : eth.wageFactor * g.wage) * 12, // machines aren't paid wages
    marketing: (m.cost * g.marketing + rv.monthly + g.monthly) * 12,
    shipping: (customers / basket) * sh.perOrder * 12,
    fees: revenue * (loc.fee + eth.share + rv.share),
    setup: STARTUP_COST + eth.oneOff + rv.oneOff + q.oneOff + g.oneOff,
  };
  const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
  const impact = impactOf(c);
  const before = { customers, rep, profit: revenue - totalCosts, impact };

  // Goal bonuses are judged on the year before any bonus is paid
  const goalResults = (c.objectives || []).filter(id => OBJECTIVES[id]).map(id => {
    const hit = Boolean(OBJECTIVES[id].target(c, before));
    return { id, hit, reward: hit ? OBJECTIVES[id].reward : 0 };
  });
  const bonus = goalResults.reduce((a, x) => a + x.reward, 0);
  const profit = revenue + bonus - totalCosts;

  return { customers, demand, capacity, turnedAway, rep, ripOff, price, unitCost, revenue, bonus, costs, totalCosts, profit, impact, goalResults, perOrder: sh.perOrder / basket };
}

function starRating(profit) {
  if (profit < 0) return 1;
  if (profit < 10000) return 2;
  if (profit < 30000) return 3;
  if (profit < 60000) return 4;
  return 5;
}

// Checks a finished game's choices (used by the server). Returns tidy choices or null.
function validChoices(c) {
  if (!c) return null;
  const tables = { product: PRODUCTS, location: LOCATIONS, price: PRICES, quality: QUALITY, staff: STAFF, marketing: MARKETING, ethics: ETHICS, rival: RIVAL };
  const out = {};
  for (const [k, table] of Object.entries(tables)) {
    if (typeof c[k] !== "string" || !Object.prototype.hasOwnProperty.call(table, c[k])) return null;
    out[k] = c[k];
  }
  if (out.location === "online") {
    if (!Object.prototype.hasOwnProperty.call(SHIPPING, c.shipping)) return null;
    out.shipping = c.shipping;
  }
  const goals = Array.isArray(c.objectives) ? c.objectives : [];
  if (goals.length !== 2 || goals[0] === goals[1] || !goals.every(id => Object.prototype.hasOwnProperty.call(OBJECTIVES, id))) return null;
  out.objectives = [goals[0], goals[1]];
  return out;
}

if (typeof module !== "undefined") module.exports = { simulate, starRating, cleanName, validChoices, impactOf, NAMES, PRODUCTS, LOCATIONS, PRICES, PRICE_DEMAND, QUALITY, STAFF, MARKETING, ETHICS, RIVAL, SHIPPING, OBJECTIVES };
