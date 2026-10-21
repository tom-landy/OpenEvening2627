// Runs every possible game and prints the spread of results: node tools/sim.js
const M = require("../public/model.js");
const keys = { product: Object.keys(M.PRODUCTS), location: Object.keys(M.LOCATIONS), price: ["low","mid","high"], quality: Object.keys(M.QUALITY), staff: Object.keys(M.STAFF), marketing: Object.keys(M.MARKETING), ethics: Object.keys(M.ETHICS), rival: Object.keys(M.RIVAL) };
const names = Object.keys(keys);
const runs = [];
(function walk(i, c) {
  if (i === names.length) { runs.push({ c: { ...c }, r: M.simulate(c) }); return; }
  for (const v of keys[names[i]]) { c[names[i]] = v; walk(i + 1, c); }
})(0, {});
const stars = [0,0,0,0,0,0];
runs.forEach(x => stars[M.starRating(x.r.profit)]++);
console.log("games:", runs.length);
console.log("stars 1-5:", stars.slice(1).map(n => (100*n/runs.length).toFixed(1)+"%").join("  "));
runs.sort((a,b)=>b.r.profit-a.r.profit);
const fmt = x => `${Math.round(x.r.profit).toLocaleString().padStart(9)}  ${Object.values(x.c).join(",")}`;
console.log("best:"); runs.slice(0,5).forEach(x=>console.log(fmt(x)));
console.log("worst:"); runs.slice(-3).forEach(x=>console.log(fmt(x)));
for (const k of names) for (const v of keys[k]) {
  const sub = runs.filter(x => x.c[k] === v);
  console.log(k.padEnd(10), v.padEnd(11), "avg", Math.round(sub.reduce((a,x)=>a+x.r.profit,0)/sub.length).toLocaleString().padStart(8));
}
