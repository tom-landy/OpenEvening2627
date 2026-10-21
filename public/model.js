// The business model behind the game. All numbers are per month unless noted.
// Kept separate from the UI so it can be tuned (and tested with node sim.js).

const PRODUCTS = {
  bubble: { name: "Bubble Tea", emoji: "🧋", demand: 2800, unitCost: 1.2, prices: { low: 2.5, mid: 3.8, high: 5.5 }, colour: "#ff7eb6" },
  burger: { name: "Burgers", emoji: "🍔", demand: 1800, unitCost: 2.8, prices: { low: 5, mid: 6.5, high: 9 }, colour: "#ffb347" },
  phone:  { name: "Phone Cases", emoji: "📱", demand: 650, unitCost: 2, prices: { low: 5, mid: 9, high: 15 }, colour: "#7ec8ff" },
};

const LOCATIONS = {
  street:  { footfall: 1.4, rent: 2000, fee: 0 },
  college: { footfall: 1.0, rent: 800, fee: 0 },
  online:  { footfall: 0.7, rent: 100, fee: 0.15, marketingBoost: 1.8 },
};

const PRICE_DEMAND = { low: 1.5, mid: 1, high: 0.45 };

const QUALITY = {
  budget:   { cost: 0.7, demand: 0.85, rep: -1 },
  standard: { cost: 1,   demand: 1,    rep: 0 },
  premium:  { cost: 1.4, demand: 1.15, rep: 1 },
};

const STAFF = {
  solo: { capacity: 1500, wages: 0,    rep: -0.5 },
  part: { capacity: 3000, wages: 900,  rep: 0 },
  team: { capacity: 6000, wages: 2800, rep: 0.5 },
};

const MARKETING = {
  none:       { lift: 1,   cost: 0 },
  social:     { lift: 1.3, cost: 400 },
  influencer: { lift: 1.6, cost: 1200 },
};

const ETHICS = {
  plastic:  { extraUnit: 0,    rep: -1,  share: 0 },
  recycle:  { extraUnit: 0.15, rep: 0.5, share: 0 },
  charity:  { extraUnit: 0,    rep: 1,   share: 0.05 },
};

const RIVAL = {
  pricewar: { demand: 1.05, priceCut: 0.85, oneOff: 0,    share: 0,    rep: 0 },
  newidea:  { demand: 1.1,  priceCut: 1,   oneOff: 3000, share: 0,    rep: 0.5 },
  loyalty:  { demand: 1,    priceCut: 1,   oneOff: 0,    share: 0.05, rep: 0.5 },
};

const STARTUP_COST = 5000; // one-off: fit-out, equipment, website

// Fill gaps with middle options so the live meters show a sensible projection
// before every decision has been made.
const DEFAULTS = { product: "bubble", location: "college", price: "mid", quality: "standard", staff: "part", marketing: "none", ethics: null, rival: null };

function simulate(picked) {
  const c = Object.assign({}, DEFAULTS, picked);
  const p = PRODUCTS[c.product];
  const loc = LOCATIONS[c.location];
  const q = QUALITY[c.quality];
  const st = STAFF[c.staff];
  const m = MARKETING[c.marketing];
  const eth = c.ethics ? ETHICS[c.ethics] : { extraUnit: 0, rep: 0, share: 0 };
  const rv = c.rival ? RIVAL[c.rival] : null;

  // Reputation out of 5, starts at 3
  let rep = 3 + q.rep + st.rep + eth.rep + (rv ? rv.rep : 0);
  const ripOff = c.price === "high" && c.quality === "budget";
  if (ripOff) rep -= 1.5;
  rep = Math.max(1, Math.min(5, rep));
  const repFactor = 0.4 + 0.2 * rep;

  // Premium price hurts less when the product really is premium
  let priceDemand = PRICE_DEMAND[c.price];
  if (c.price === "high" && c.quality === "premium") priceDemand = 0.75;

  let lift = m.lift;
  if (loc.marketingBoost) lift = 1 + (lift - 1) * loc.marketingBoost;

  const rivalDemand = rv ? rv.demand : 1;

  const demand = Math.round(p.demand * loc.footfall * priceDemand * q.demand * lift * repFactor * rivalDemand);
  const capacity = st.capacity;
  const customers = Math.min(demand, capacity);
  const turnedAway = Math.max(0, demand - capacity);

  const price = p.prices[c.price] * (rv ? rv.priceCut : 1);
  const unitCost = p.unitCost * q.cost + eth.extraUnit;

  const revenue = customers * price * 12;
  const costs = {
    stock: customers * unitCost * 12,
    rent: loc.rent * 12,
    wages: st.wages * 12,
    marketing: m.cost * 12,
    fees: revenue * (loc.fee + eth.share + (rv ? rv.share : 0)),
    setup: STARTUP_COST + (rv ? rv.oneOff : 0),
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

if (typeof module !== "undefined") module.exports = { simulate, starRating, PRODUCTS, LOCATIONS, QUALITY, STAFF, MARKETING, ETHICS, RIVAL, PRICE_DEMAND };
