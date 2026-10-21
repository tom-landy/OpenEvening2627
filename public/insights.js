// Facts about tonight's games for the ticker on the game screens, worked out
// from everyone's results. Needs model.js and options.js loaded first.
function buildInsights(all) {
  if (all.length < 3) return [];
  const fmt = n => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
  const clean = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const avg = list => list.reduce((a, r) => a + r.profit, 0) / list.length;
  const val = (v, r) => (typeof v === "function" ? v(r.choices) : v);
  const out = [];

  const winners = all.filter(r => r.profit > 0).length;
  out.push(`🏁 <b>${all.length}</b> businesses started tonight, and <b>${Math.round((100 * winners) / all.length)}%</b> made a profit`);
  const best = all.reduce((a, r) => (r.profit > a.profit ? r : a));
  out.push(`🏆 Top so far: ${PRODUCTS[best.choices.product].emoji} <b>${clean(best.name)}</b> with ${fmt(best.profit)}`);
  const counts = {};
  all.forEach(r => (counts[r.choices.product] = (counts[r.choices.product] || 0) + 1));
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  out.push(`🛍️ Most popular tonight: ${PRODUCTS[top].emoji} <b>${PRODUCTS[top].name}</b> (${Math.round((100 * counts[top]) / all.length)}% of businesses)`);

  // Which choices made the most difference: those who picked it vs everyone else
  // Small groups give wild averages, so a choice needs a few games behind it
  const min = Math.max(5, Math.round(all.length * 0.08));
  const diffs = [];
  const compare = (pool, test, sentence) => {
    const yes = pool.filter(test), no = pool.filter(r => !test(r));
    if (yes.length >= min && no.length >= min) diffs.push({ n: yes.length, diff: avg(yes) - avg(no), sentence });
  };
  for (const d of DECISIONS) {
    const pool = d.when ? all.filter(r => d.when(r.choices)) : all;
    for (const o of d.options) compare(pool, r => r.choices[d.key] === o.id, o.phrase);
  }
  for (const g of GOALS) compare(all, r => (r.choices.objectives || []).includes(g.id), g.phrase);
  const good = diffs.filter(x => x.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 4);
  good.forEach(x => out.push(`💡 The <b>${x.n}</b> businesses that ${x.sentence} earned <b>${fmt(x.diff)}</b> more on average`));
  const bad = diffs.filter(x => x.diff < 0).sort((a, b) => a.diff - b.diff)[0];
  if (bad) out.push(`⚠️ Watch out: the ${bad.n} businesses that ${bad.sentence} earned <b>${fmt(-bad.diff)}</b> less on average`);

  // The best reaction to each surprise event, compared with other reactions to it
  const responses = [];
  for (const [id, t] of Object.entries(EVENT_TEXT)) {
    const hit = all.filter(r => r.choices.event === id);
    for (const rid of Object.keys(t.responses)) {
      const yes = hit.filter(r => r.choices.response === rid), no = hit.filter(r => r.choices.response !== rid);
      if (yes.length >= 4 && no.length >= 5) responses.push({ t, label: val(t.responses[rid].label, yes[0]), n: yes.length, diff: avg(yes) - avg(no), title: val(t.title, yes[0]) });
    }
  }
  const seen = new Set();
  responses.filter(x => x.diff > 0).sort((a, b) => b.diff - a.diff)
    .filter(x => !seen.has(x.t) && seen.add(x.t)).slice(0, 2).forEach(x =>
    out.push(`📰 ${x.t.emoji} ${clean(x.title.replace(/!$/, ""))}: the ${x.n} who chose “${clean(x.label)}” earned <b>${fmt(x.diff)}</b> more than other reactions`));

  return out;
}
