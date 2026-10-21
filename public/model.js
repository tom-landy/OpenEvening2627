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
  online:  { footfall: 0.8, rent: 100, fee: 0.15, marketingBoost: 1.8 },
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
}, { capacity: 1, cheap: false, posh: false });

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
const DEFAULTS = { product: "bubble", location: "college", price: "mid", quality: "standard", staff: "part", marketing: "none" };
const NEUTRAL_ETHICS = { extraUnit: 0, rep: 0, share: 0, wageFactor: 1, oneOff: 0, capacity: 1 };
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

  // Reputation out of 5, starts at 3
  let rep = 3 + pr.rep + q.rep + st.rep + m.rep + eth.rep + rv.rep;
  const ripOff = (c.price === "high" || c.price === "luxury") && q.cheap;
  if (ripOff) rep -= 1.5;
  rep = Math.max(1, Math.min(5, rep));
  const repFactor = 0.4 + 0.2 * rep;

  // Premium prices hurt less when the product really is premium
  const priceDemand = q.posh && pr.premiumDemand ? pr.premiumDemand : pr.demand;
  const lift = 1 + (m.lift - 1) * loc.marketingBoost;

  const demand = Math.round(p.demand * loc.footfall * priceDemand * q.demand * lift * repFactor * rv.demand);
  const capacity = Math.round(st.capacity * q.capacity * eth.capacity);
  const customers = Math.min(demand, capacity);
  const turnedAway = Math.max(0, demand - capacity);

  const price = p.prices[pr.of] * pr.mult * rv.priceCut;
  const unitCost = p.unitCost * q.cost + eth.extraUnit;

  const revenue = customers * price * 12;
  const costs = {
    stock: customers * unitCost * 12,
    rent: loc.rent * 12,
    wages: st.wages * (c.staff === "robots" ? 1 : eth.wageFactor) * 12, // machines aren't paid wages
    marketing: (m.cost + rv.monthly) * 12,
    fees: revenue * (loc.fee + eth.share + rv.share),
    setup: STARTUP_COST + eth.oneOff + rv.oneOff,
  };
  const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
  const profit = revenue - totalCosts;

  return { customers, demand, capacity, turnedAway, rep, ripOff, price, unitCost, revenue, costs, totalCosts, profit };
}

function starRating(profit) {
  if (profit < 0) return 1;
  if (profit < 10000) return 2;
  if (profit < 30000) return 3;
  if (profit < 60000) return 4;
  return 5;
}

if (typeof module !== "undefined") module.exports = { simulate, starRating, cleanName, NAMES, PRODUCTS, LOCATIONS, PRICES, PRICE_DEMAND, QUALITY, STAFF, MARKETING, ETHICS, RIVAL };
