// Plays a large random sample of games and prints the spread of results:
// node tools/sim.js [games]   (default 1,000,000)
// There are too many combinations to play every one since goals and shipping
// were added, so this picks every choice at random, like a player tapping blind.
const M = require("../public/model.js");
const keys = {
  product: Object.keys(M.PRODUCTS), location: Object.keys(M.LOCATIONS), price: Object.keys(M.PRICES),
  quality: Object.keys(M.QUALITY), staff: Object.keys(M.STAFF), marketing: Object.keys(M.MARKETING),
  ethics: Object.keys(M.ETHICS), rival: Object.keys(M.RIVAL), shipping: Object.keys(M.SHIPPING),
};
const goals = Object.keys(M.OBJECTIVES);
const names = Object.keys(keys);
const N = Number(process.argv[2]) || 1000000;
const pick = a => a[Math.floor(Math.random() * a.length)];

const stars = [0, 0, 0, 0, 0, 0];
const sums = {};
const add = (k, profit) => { const s = (sums[k] = sums[k] || [0, 0]); s[0] += profit; s[1]++; };
const goalHits = {};
let best = null, worst = null;

for (let i = 0; i < N; i++) {
  const c = {};
  for (const k of names) c[k] = pick(keys[k]);
  const a = pick(goals);
  let b = pick(goals);
  while (b === a) b = pick(goals);
  c.objectives = [a, b];
  const r = M.simulate(c);
  stars[M.starRating(r.profit)]++;
  for (const k of names) if (k !== "shipping" || c.location === "online") add(k + ":" + c[k], r.profit);
  for (const g of r.goalResults) { add("goal:" + g.id, r.profit); const h = (goalHits[g.id] = goalHits[g.id] || [0, 0]); h[0] += g.hit; h[1]++; }
  if (!best || r.profit > best.profit) best = { profit: r.profit, c };
  if (!worst || r.profit < worst.profit) worst = { profit: r.profit, c };
}

const fmt = n => Math.round(n).toLocaleString().padStart(9);
const desc = c => Object.entries(c).map(([k, v]) => (k === "shipping" && c.location !== "online" ? null : [].concat(v).join("+"))).filter(Boolean).join(",");
console.log("games:", N.toLocaleString(), "(random sample)");
console.log("stars 1-5:", stars.slice(1).map(n => ((100 * n) / N).toFixed(1) + "%").join("  "));
console.log("best: ", fmt(best.profit), desc(best.c));
console.log("worst:", fmt(worst.profit), desc(worst.c));
for (const k of Object.keys(sums)) {
  const [sum, n] = sums[k];
  const [group, id] = k.split(":");
  const hit = group === "goal" ? `  hit ${((100 * goalHits[id][0]) / goalHits[id][1]).toFixed(0)}%` : "";
  console.log(group.padEnd(10), id.padEnd(11), "avg", fmt(sum / n) + hit);
}
