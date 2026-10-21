// Plays every possible game and prints the spread of results: node tools/sim.js
// Stats are kept as running totals because there are millions of games.
const M = require("../public/model.js");
const keys = {
  product: Object.keys(M.PRODUCTS), location: Object.keys(M.LOCATIONS), price: Object.keys(M.PRICES),
  quality: Object.keys(M.QUALITY), staff: Object.keys(M.STAFF), marketing: Object.keys(M.MARKETING),
  ethics: Object.keys(M.ETHICS), rival: Object.keys(M.RIVAL),
};
const names = Object.keys(keys);
const stars = [0, 0, 0, 0, 0, 0];
const sums = {};
names.forEach(k => keys[k].forEach(v => (sums[k + ":" + v] = [0, 0])));
let games = 0, best = null, worst = null;

(function walk(i, c) {
  if (i === names.length) {
    const profit = M.simulate(c).profit;
    games++;
    stars[M.starRating(profit)]++;
    for (const k of names) { const s = sums[k + ":" + c[k]]; s[0] += profit; s[1]++; }
    if (!best || profit > best.profit) best = { profit, c: { ...c } };
    if (!worst || profit < worst.profit) worst = { profit, c: { ...c } };
    return;
  }
  for (const v of keys[names[i]]) { c[names[i]] = v; walk(i + 1, c); }
})(0, {});

const fmt = n => Math.round(n).toLocaleString().padStart(9);
console.log("games:", games.toLocaleString());
console.log("stars 1-5:", stars.slice(1).map(n => ((100 * n) / games).toFixed(1) + "%").join("  "));
console.log("best: ", fmt(best.profit), Object.values(best.c).join(","));
console.log("worst:", fmt(worst.profit), Object.values(worst.c).join(","));
for (const k of names) for (const v of keys[k]) {
  const [sum, n] = sums[k + ":" + v];
  console.log(k.padEnd(10), v.padEnd(11), "avg", fmt(sum / n));
}
