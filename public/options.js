// Decisions 2 to 8 and their options. Used by the game (labels, hints, feedback)
// and by the dashboard (labels and the "big lesson" wording). The numbers behind
// each option live in model.js under the same ids.
//
// name: short heading on the dashboard. label: shown on the game card. short: dashboard label. phrase: finishes the
// sentence "People who ___ made £X more on average". sub/fb can be text or a
// function of (state, result) when the wording depends on the product.
// A decision-level fb runs first; it can return text, { emoji, text } or null
// to fall back to the chosen option's own fb.

const pounds = n => "£" + (n >= 20 && n % 1 === 0 ? n : n.toFixed(2));
const unitWord = s => PRODUCTS[s.product].unit || "each";
const priceFor = (s, id) => priceOf(s.product, id);
// Share of each sale left after paying for stock, as "40%"
const pct = share => Math.max(0, Math.round(100 * share)) + "%";
const keepOf = (s, id) => pct(PRICES[id].margin);
const isFood = s => PRODUCTS[s.product].staff[0] === "🧑‍🍳";

// Picked after naming the business: choose 2. Players only see the label and
// target; effect, reward and penalty are revealed on the results screen.
// Numbers live in OBJECTIVES in model.js.
const GOALS = [
  { id: "profit", phrase: "aimed for £30,000 profit", emoji: "💰", label: "Make £30,000 profit", short: "£30k profit", target: "Profit of £30,000 or more",
    effect: "You haggled hard: stock 5% cheaper, but suppliers like you less", reward: "£2,000 investor bonus", penalty: "Your investor pulls out: -£1,500" },
  { id: "survive", phrase: "aimed just to survive", emoji: "🛟", label: "Survive year one", short: "Survive", target: "Don't make a loss",
    effect: "You spent carefully: 20% less on marketing", reward: "£1,000 off your bank loan", penalty: "Bank charges for going overdrawn: -£500" },
  { id: "growth", phrase: "aimed to grow fast", emoji: "📈", label: "Grow fast", short: "Grow fast", target: "50% more customers than a typical shop like yours",
    effect: "10% more customers, £200 a month on promotions", reward: "£1,500 growth grant" },
  { id: "stars", phrase: "went for five-star reviews", emoji: "⭐", label: "Five-star reviews", short: "5-star reviews", target: "A reputation of 4.5 stars or more",
    effect: "Better reputation, £150 a month on staff training", reward: "£1,000 business award" },
  { id: "green", phrase: "set out to go green", emoji: "🌍", label: "Go green", short: "Go green", target: "4 or more trees for the planet",
    effect: "Greener stock cost 3% more, customers liked it", reward: "£2,000 green grant" },
  { id: "community", phrase: "set out to help the community", emoji: "🏘️", label: "Help the community", short: "Community", target: "5 houses for the local area",
    effect: "You sponsored a local team for £100 a month", reward: "£1,500 council grant" },
  { id: "rival", phrase: "set out to beat the competition", emoji: "🥊", label: "Beat the competition", short: "Beat rivals", target: "Don't lose customers when a rival opens",
    effect: "Prices 5% lower, 8% more customers", reward: "£1,000 market share prize" },
  { id: "jobs", phrase: "set out to create local jobs", emoji: "👷", label: "Create local jobs", short: "Create jobs", target: "Employ an apprentice, a part-timer or a team",
    effect: "Training new staff added 10% to wages", reward: "£1,500 hiring incentive" },
  { id: "luxury", phrase: "built a luxury brand", emoji: "💎", label: "Build a luxury brand", short: "Luxury brand", target: "Premium or luxury prices with top-quality stock",
    effect: "Prices 5% higher, 5% fewer customers", reward: "£2,000 brand deal", penalty: "The brand deal collapses: -£1,000" },
  { id: "innovate", phrase: "set out to innovate", emoji: "💡", label: "Be the most innovative", short: "Innovate", target: "Make your own stock or launch something new",
    effect: "£2,000 spent on new ideas, 8% more customers", reward: "£1,500 innovation grant" },
  { id: "cheapest", phrase: "tried to be the cheapest in town", emoji: "🏷️", label: "Be the cheapest in town", short: "Cheapest", target: "50% more customers than a typical shop like yours",
    effect: "Prices 12% lower on everything, only 12% more customers", reward: "£500 'best value' award" },
  { id: "expand", phrase: "opened a second shop", emoji: "🏢", label: "Open a second shop", short: "Second shop", target: "Profit of £40,000 or more to pay for it",
    effect: "£7,000 to fit out and £400 a month rent, 15% more customers", reward: "£3,000 from the bank to grow again", penalty: "Loan charges you can't cover: -£2,000" },
];

const DECISIONS = [
  {
    key: "location", name: "Location", icon: "📍", title: "Where will you set up?",
    options: [
      { id: "street", emoji: "🏙️", label: "High street", short: "High street", phrase: "set up on the high street",
        sub: "Super busy, rent £2,000 a month", fb: "Thousands walk past every day. That rent hurts if they don't come in." },
      { id: "mall", emoji: "🛍️", label: "Shopping centre", short: "Shopping centre", phrase: "set up in a shopping centre",
        sub: "Busiest of all, rent £3,200 a month", fb: "Crowds of shoppers, rain or shine. You'll need big sales to pay that rent!" },
      { id: "college", emoji: "🏫", label: "Next to a college", short: "Next to college", phrase: "set up next to a college",
        sub: "Steady crowd, rent £800 a month", fb: "Hungry students on your doorstep, and rent you can afford." },
      { id: "market", emoji: "⛺", label: "Market stall", short: "Market stall", phrase: "ran a market stall",
        sub: "Cheapest pitch, £250 a month, fewer shoppers", fb: "Tiny costs, friendly regulars. But only so many people visit a market." },
      { id: "van", emoji: "🚐", label: "Pop-up van", short: "Pop-up van", phrase: "ran a pop-up van",
        sub: "Go to events, £600 a month", fb: "Festivals, matches, fairs: you go where the crowds are. Adverts tell them where you'll be." },
      { id: "online", emoji: "💻", label: "Online only", short: "Online only", phrase: "went online only",
        sub: "Tiny rent, but apps take 8% of sales", fb: "Hardly any rent! But nobody walks past a website. People need to find you." },
    ],
  },
  {
    key: "shipping", name: "Shipping", icon: "📦", title: "You sell online. Who will deliver your orders?",
    when: s => s.location === "online",
    options: [
      { id: "customer", emoji: "🏷️", label: "Customer pays postage", short: "Customer pays", phrase: "made customers pay postage",
        sub: "Costs you nothing, but lots of people give up at checkout", fb: "Free for you, but 3 in 10 shoppers abandon their basket when they see the postage." },
      { id: "budget", emoji: "🐌", label: "Budget courier", short: "Budget", phrase: "used a budget courier",
        sub: s => `${pounds(1.5)} a parcel. Late and lost parcels`, fb: "Cheap, but parcels turn up late or squashed. One-star reviews are rolling in." },
      { id: "tracked", emoji: "📮", label: "Tracked delivery", short: "Tracked", phrase: "used tracked delivery",
        sub: s => `${pounds(2.5)} a parcel. Reliable`, fb: "Parcels arrive on time with tracking. No complaints." },
      { id: "express", emoji: "⚡", label: "Next-day express", short: "Next-day", phrase: "offered next-day delivery",
        sub: s => `${pounds(3.8)} a parcel. Customers love it`, fb: "Order today, here tomorrow! Customers love it, but it's pricey for you." },
      { id: "green", emoji: "🚲", label: "Carbon-neutral courier", short: "Carbon-neutral", phrase: "used a carbon-neutral courier",
        sub: s => `${pounds(3)} a parcel. Bikes and electric vans`, fb: "Bikes and electric vans. Customers like that it's planet-friendly." },
      { id: "myself", emoji: "🚗", label: "Deliver it myself", short: "Myself", phrase: "delivered orders themselves",
        sub: s => `About ${pounds(0.8)} a parcel in fuel, but it eats your time`, fb: "Cheap and personal, but hours in the car means fewer orders packed." },
    ],
    fb: (s, r) => r.perOrder > r.price - r.unitCost
      ? { emoji: "😱", text: `Each delivery costs more than you make on the sale. You <b>lose money</b> on every order!` }
      : null,
  },
  {
    key: "price", name: "Price", icon: "💷", title: "How much will you charge?",
    desc: "Every product costs something to make. The higher your price, the more of each sale you keep, but the fewer people buy.",
    // Shown as the share of each sale kept after paying for stock. It's the
    // same for every product, so everyone competes on a level playing field
    options: [
      { id: "rock", emoji: "📉", label: "Rock bottom", short: "Rock bottom", phrase: "charged rock-bottom prices",
        sub: s => `Keep ${keepOf(s, "rock")} of each sale. Cheapest in town` },
      { id: "low", emoji: "🏷️", label: "Bargain", short: "Bargain", phrase: "charged bargain prices",
        sub: s => `Keep ${keepOf(s, "low")} of each sale. Crowds love a deal` },
      { id: "pwyw", emoji: "🤲", label: "Pay what you want", short: "Pay what you want", phrase: "let people pay what they want",
        sub: s => `Keep about ${keepOf(s, "pwyw")} of each sale. People love it` },
      { id: "mid", emoji: "⚖️", label: "Fair price", short: "Fair", phrase: "charged a fair price",
        sub: s => `Keep ${keepOf(s, "mid")} of each sale. Same as most places` },
      { id: "high", emoji: "💎", label: "Premium", short: "Premium", phrase: "charged premium prices",
        sub: s => `Keep ${keepOf(s, "high")} of each sale. Fewer buyers` },
      { id: "luxury", emoji: "👑", label: "Luxury", short: "Luxury", phrase: "charged luxury prices",
        sub: s => `Keep ${keepOf(s, "luxury")} of each sale. Only for the few` },
    ],
    fb: (s, r) => {
      const margin = r.price - r.unitCost;
      if (margin <= 0) return { emoji: "😱", text: `Uh oh! Each one costs more to make than you sell it for, so you <b>lose money</b> every time you sell one.` };
      const keep = pct(margin / r.price);
      return {
        rock: `So cheap! Queues for days, but you only keep ${keep} of each sale.`,
        low: `Cheap! More customers, but you only keep ${keep} of each sale.`,
        pwyw: `People love choosing! Most pay a bit less than normal, so you keep about ${keep} of each sale.`,
        mid: `A fair price. You keep ${keep} of each sale after paying for stock, before rent and wages.`,
        high: `You keep ${keep} of each sale. Customers will expect it to be amazing.`,
        luxury: `You keep a huge ${keep} of each sale, but most people can't afford it.`,
      }[s.price];
    },
  },
  {
    key: "quality", name: "Supplier", icon: "🥇", title: "Which supplier will you use?",
    options: [
      { id: "bulk", emoji: "🚢", label: "Bulk from abroad", short: "Bulk import", phrase: "bought cheap bulk stock",
        sub: "Super cheap, slow deliveries, poor quality", fb: "Cheapest stock going, but it arrives late and some of it is rubbish." },
      { id: "budget", emoji: "📦", label: "Budget", short: "Budget", phrase: "used a budget supplier",
        sub: "Cheap stock, so-so quality", fb: "Cheap stock saves money, but some customers won't come back." },
      { id: "standard", emoji: "👍", label: "Standard", short: "Standard", phrase: "used a standard supplier",
        sub: "Decent stuff, normal price", fb: "Solid quality. Nobody's complaining." },
      { id: "mix", emoji: "🧰", label: "Make some, buy the rest", short: "Make some", phrase: "made some of their stock",
        sub: "£1,500 of kit, cheaper stock, a bit less time to serve", fb: "You make the best sellers yourself and buy in the rest. Smart!" },
      { id: "make", emoji: "🛠️", label: "Make it ourselves", short: "Make it", phrase: "made their own stock",
        sub: "£4,000 of kit, cheapest stock, but it takes your time",
        fb: (s, r) => r.turnedAway > 0 ? "Handmade and loved, but you can't make enough to keep up!" : "Handmade by you! Customers love it, and every one costs you less." },
      { id: "local", emoji: "📍", label: "Local supplier", short: "Local", phrase: "bought from a local supplier",
        sub: "Fresh and local, costs 15% more", fb: "Customers love that you support local businesses!" },
      { id: "fairtrade", emoji: "🌍", label: "Fairtrade", short: "Fairtrade", phrase: "used a Fairtrade supplier",
        sub: "Fair pay for the makers, costs 25% more", fb: "The people who make your stock get a fair deal. Customers trust you." },
      { id: "premium", emoji: "✨", label: "Premium", short: "Premium", phrase: "used a premium supplier",
        sub: "Top quality, costs 40% more" },
    ],
    fb: (s, r) => {
      if (r.ripOff) return { emoji: "😠", text: "Top prices for cheap stuff? Customers feel ripped off. Bad reviews incoming!" };
      if (s.quality === "premium") return s.price === "high" || s.price === "luxury" ? "Premium price, premium product. People happily pay for quality!" : "Amazing quality! Word is spreading, but each one costs you more to make.";
      return null; // use the option's own fb
    },
  },
  {
    key: "staff", name: "Staff", icon: "🧑‍🍳", title: "Who's working in your business?",
    options: [
      { id: "solo", emoji: "🙋", label: "Just me", short: "Just me", phrase: "worked alone",
        sub: "No wages, but you can only serve so many" },
      { id: "family", emoji: "👵", label: "Family & friends", short: "Family & friends", phrase: "got family to help",
        sub: "£200 a month in treats, a bit chaotic" },
      { id: "apprentice", emoji: "🧑‍🎓", label: "Hire an apprentice", short: "Apprentice", phrase: "hired an apprentice",
        sub: "£650 a month, train a young person" },
      { id: "part", emoji: "👯", label: "Me + a part-timer", short: "+ part-timer", phrase: "hired a part-timer",
        sub: "£900 a month in wages" },
      { id: "team", emoji: "👨‍👩‍👧‍👦", label: "A full team", short: "Full team", phrase: "hired a full team",
        sub: "£2,500 a month, serve loads of people" },
      { id: "robots", emoji: "🤖", label: "Self-service machines", short: "Machines", phrase: "used self-service machines",
        sub: "£1,400 a month to rent, never get tired" },
    ],
    fb: (s, r) => {
      if (r.turnedAway > 0) return { emoji: "😫", text: `Queue out the door! You're turning away <b>${r.turnedAway.toLocaleString()}</b> customers a month.` };
      if (r.customers < r.capacity * 0.5 && (s.staff === "team" || s.staff === "robots")) return { emoji: "🥱", text: "It's quiet. You're paying for help you don't need yet." };
      return {
        solo: "Just you, doing everything. Exhausting, but you keep every penny.",
        family: "Grandma's on the till! Cheap help, even if it's a bit chaotic.",
        apprentice: "You're training someone new. Customers like a business that gives young people a start.",
        part: "Just the right number of people to serve everyone who comes in.",
        team: "A proper team, serving everyone with a smile.",
        robots: "Beep boop! Fast service, but some customers miss a friendly face.",
      }[s.staff];
    },
  },
  {
    key: "marketing", name: "Marketing", icon: "📣", title: "How will people hear about you?",
    options: [
      { id: "none", emoji: "💬", label: "Word of mouth", short: "Word of mouth", phrase: "relied on word of mouth",
        sub: "Free! Hope people tell their friends" },
      { id: "flyers", emoji: "📄", label: "Flyers", short: "Flyers", phrase: "handed out flyers",
        sub: "Hand them out locally, £150 a month", fb: "A few new faces, but lots of flyers end up in the bin." },
      { id: "samples", emoji: "🎁", label: "Free samples", short: "Free samples", phrase: "gave away free samples",
        sub: "Let people try it, £450 a month", fb: s => isFood(s) ? "One taste and they're hooked! People love a freebie." : "Free gifts get people talking, and coming back for more!" },
      { id: "social", emoji: "📸", label: "Social media", short: "Social media", phrase: "used social media",
        sub: "Ads and posts, £400 a month", fb: "Your posts are getting likes and shares. New faces every week!" },
      { id: "influencer", emoji: "🤳", label: "Pay an influencer", short: "Influencer", phrase: "paid an influencer",
        sub: "Huge reach, £1,200 a month" },
      { id: "billboard", emoji: "🪧", label: "Billboard", short: "Billboard", phrase: "put up a billboard",
        sub: "Giant poster in town, £1,600 a month", fb: "Everyone driving past sees your name. Is it worth the money?" },
    ],
    fb: (s, r) => {
      if (s.marketing === "none") return s.location === "online" ? "Online with no adverts? Hardly anyone can find you." : "Free is nice, but lots of people still don't know you exist.";
      if (s.marketing === "influencer") return r.turnedAway > 0 ? "Thousands of fans want in, but you can't serve them all!" : "Your video went viral! Is the extra cost worth it?";
      return null;
    },
  },
  {
    key: "ethics", name: "Doing right", icon: "🌍", title: "How will you do the right thing?",
    options: [
      { id: "plastic", emoji: "🥤", label: "Cheapest packaging", short: "Plastic", phrase: "used plastic packaging",
        sub: "Plastic. Costs nothing extra", fb: "Someone posted your plastic waste online. Your reputation took a hit." },
      { id: "recycle", emoji: "♻️", label: "Recyclable packaging", short: "Recyclable", phrase: "used recyclable packaging",
        sub: "15p extra on every sale", fb: "Customers notice you care about the planet. Good for your reputation!" },
      { id: "charity", emoji: "💚", label: "Help a local charity", short: "Charity", phrase: "gave to charity",
        sub: "Give away 5% of your sales", fb: "The local paper wrote about you. People love a business that gives back!" },
      { id: "wage", emoji: "💷", label: "Pay a real living wage", short: "Living wage", phrase: "paid a real living wage",
        sub: "Staff cost 20% more, but they work harder", fb: s => s.staff === "solo" ? "Nice idea, but it's just you! Customers still like the promise." : "Happy staff work harder and stay longer. Customers notice!" },
      { id: "solar", emoji: "☀️", label: "Solar panels", short: "Solar panels", phrase: "fitted solar panels",
        sub: "£4,000 up front, clean energy", fb: "Clean energy! It cost a lot up front, but people respect it." },
      { id: "volunteer", emoji: "🤝", label: "Volunteer locally", short: "Volunteer", phrase: "volunteered in the community",
        sub: "Close one day a month to help out", fb: "You helped at the food bank. The whole town is talking about you!" },
    ],
  },
  {
    key: "rival", name: "vs the rival", icon: "🚨", title: "🚨 A rival just opened nearby! What now?",
    options: [
      { id: "pricewar", emoji: "🔥", label: "Price war", short: "Price war", phrase: "started a price war",
        sub: "Cut your prices by 15%", fb: "You kept your customers, but now you earn less on every sale." },
      { id: "newidea", emoji: "🚀", label: "Launch something new", short: "Something new", phrase: "launched something new",
        sub: "£3,000 for a reason to choose you", fb: "Your new idea is a hit! People are choosing you over the rival." },
      { id: "loyalty", emoji: "💳", label: "Loyalty cards", short: "Loyalty cards", phrase: "brought in loyalty cards",
        sub: "Regulars get 5% off, so they stay", fb: "Your regulars are sticking with you. Loyal customers are gold." },
      { id: "service", emoji: "😊", label: "Amazing service", short: "Better service", phrase: "trained staff in great service",
        sub: "£1,500 on training, win hearts", fb: "Five-star reviews everywhere! Some people still try the rival, but they come back." },
      { id: "advertise", emoji: "📣", label: "Advertise harder", short: "More adverts", phrase: "advertised harder",
        sub: "Extra £800 a month on adverts", fb: "Your adverts drown out the rival's. Costly, but it works." },
      { id: "ignore", emoji: "🙈", label: "Ignore them", short: "Ignored it", phrase: "ignored the rival",
        sub: "Free! Hope it goes away", fb: "The rival didn't go away. A quarter of your customers went to try them." },
    ],
  },
];

// ---- Surprise events (numbers in EVENTS in model.js) ----
// text and labels can be functions of the game state so they fit the business.
const productName = s => PRODUCTS[s.product].name.toLowerCase();
const EVENT_TEXT = {
  heatwave: {
    emoji: "☀️", title: "Heatwave!",
    text: s => ["bubble", "icecream"].includes(s.product)
      ? "A three-month heatwave hits. Everyone wants something cold, and you can't keep up!"
      : ["pizza", "burger"].includes(s.product)
        ? "A three-month heatwave hits. Nobody wants hot food when it's 32°C outside."
        : "A three-month heatwave hits. Everyone's at the beach instead of shopping.",
    responses: {
      machine: { emoji: "🧊", label: s => (["bubble", "icecream"].includes(s.product) ? "Rent a second machine" : "Rent a slushie machine"),
        sub: "£1,500 for the summer, sell cold drinks too", fb: "Ice-cold drinks fly off the counter. Smart thinking!" },
      beach: { emoji: "🏖️", label: "Pop-up stall at the beach", sub: "£800 to go where the people are", fb: "You followed the crowds to the beach. Sunburnt but busy!" },
      hours: { emoji: "🌙", label: "Open evenings only", sub: "Save £300 a month on bills, lose some sales", fb: "Cooler evenings, lower bills. Not a bad plan." },
      nothing: { emoji: "😎", label: "Wait for it to pass", sub: "Free, but you miss out", fb: "You sat it out. Other businesses made the most of the sunshine." },
    },
  },
  supplier: {
    emoji: "🏚️", title: "Your supplier goes bust!",
    text: "Your main supplier has closed down. Stock is suddenly 30% dearer and you're running short.",
    responses: {
      local: { emoji: "📍", label: "Find a local supplier", sub: "A bit dearer than before, but reliable", fb: "A local firm steps in. Customers love the local story too." },
      wholesale: { emoji: "🏬", label: "Buy from a wholesaler", sub: "Quick fix at a small mark-up", fb: "The wholesaler keeps your shelves full while you sort things out." },
      makeit: { emoji: "🛠️", label: "Make it yourself for now", sub: "£1,200 of kit, much cheaper stock", fb: "You rolled up your sleeves and made it yourself. Cheaper and fresher!" },
      raise: { emoji: "📈", label: "Raise prices to cover it", sub: "10% higher prices, some customers leave", fb: "Higher prices cover the cost, but some regulars grumble." },
    },
  },
  viral: {
    emoji: "📱", title: "You've gone viral!",
    text: s => `A video about your ${productName(s)} gets a million views. For three months, everyone wants to visit!`,
    responses: {
      temps: { emoji: "👥", label: "Hire temporary staff", sub: "£900 a month to serve the crowds", fb: "Extra hands mean nobody waits too long. Fans are happy!" },
      raise: { emoji: "💷", label: "Raise prices while it's hot", sub: "10% more per sale", fb: "Demand is high, so you charged more. A classic business move." },
      merch: { emoji: "🧢", label: "Sell merch", sub: "£500 of caps and stickers, earns about £2,000", fb: "Caps and stickers sell out. Your brand is everywhere!" },
      nothing: { emoji: "🤷", label: "Carry on as normal", sub: "Free, but queues get long", fb: "Long queues and grumpy fans. Some never come back." },
    },
  },
  badreview: {
    emoji: "⭐", title: "A one-star review goes viral",
    text: "A furious one-star review is shared thousands of times. Customers are staying away.",
    responses: {
      apology: { emoji: "🙏", label: "Say sorry with vouchers", sub: "£600 of free vouchers", fb: "A public apology and a voucher win most people back." },
      invite: { emoji: "☕", label: "Invite the reviewer back", sub: "£100 for a free visit, on camera", fb: "They came back, loved it, and posted a five-star update!" },
      argue: { emoji: "😤", label: "Reply and argue back", sub: "Free! Tell them they're wrong", fb: "Arguing online made it ten times worse. Ouch." },
      nothing: { emoji: "🙈", label: "Ignore it", sub: "Free, hope it blows over", fb: "It blew over eventually, but you lost customers for months." },
    },
  },
  energy: {
    emoji: "⚡", title: "Energy bills double!",
    text: "Electricity and gas prices double for six months. That's an extra £400 a month.",
    responses: {
      led: { emoji: "💡", label: "Fit LED lights and efficient kit", sub: "£1,200 now, saves £250 a month", fb: "New kit cuts your bills, and keeps saving next year too." },
      pass: { emoji: "🏷️", label: "Put prices up a little", sub: "5% higher prices", fb: "A small price rise covers it. Most customers don't notice." },
      hours: { emoji: "⏰", label: "Open shorter hours", sub: "Saves £200 a month, serve fewer people", fb: "Shorter hours save energy, but you serve fewer customers." },
      nothing: { emoji: "😬", label: "Just pay it", sub: "Costs £2,400 over six months", fb: "You paid up. Ouch, but at least nothing else changed." },
    },
  },
  roadworks: {
    emoji: "🚧", title: "Roadworks outside!",
    text: "The council digs up the road outside for three months. Hardly anyone can get to you.",
    responses: {
      delivery: { emoji: "🛵", label: "Start delivering", sub: "£250 a month for a delivery app", fb: "If they can't come to you, you go to them!" },
      signs: { emoji: "🪧", label: "Big 'Still open!' signs and offers", sub: "£300", fb: "Bright signs and a deal tempt people across the barriers." },
      popup: { emoji: "⛺", label: "Pop-up stall somewhere else", sub: "£700 to set up nearby", fb: "You moved to where the people are. Business keeps going!" },
      nothing: { emoji: "😩", label: "Wait it out", sub: "Free, but three quiet months", fb: "Three very quiet months. You'll be glad when it's over." },
    },
  },
  hacked: {
    emoji: "💻", title: "Your website is hacked!",
    text: "Hackers take your website down. For two months, half your orders vanish.",
    responses: {
      expert: { emoji: "🧑‍💻", label: "Pay a security expert", sub: "£1,200, fixed in days", fb: "The expert fixed it fast and made it safer than before." },
      diy: { emoji: "🔧", label: "Fix it yourself", sub: "Free, but it takes your time", fb: "You got it working, but it took ages and orders piled up." },
      platform: { emoji: "🛒", label: "Move to a big shopping platform", sub: "£200 a month in fees", fb: "A big platform is safer and brings new shoppers too." },
      nothing: { emoji: "🙈", label: "Hope it fixes itself", sub: "Free", fb: "It didn't fix itself. Customers worry about their card details." },
    },
  },
  sick: {
    emoji: "🤒", title: s => (s.staff === "solo" ? "You're ill!" : "Your best worker is off sick"),
    text: s => (s.staff === "solo" ? "You're stuck in bed for two months. Who's running the business?" : "Your best worker is off for two months. Everyone else is stretched."),
    responses: {
      agency: { emoji: "🧑‍🔧", label: "Hire agency staff", sub: "£1,100 a month, fully covered", fb: "Agency staff keep things running smoothly. Pricey, but reliable." },
      family: { emoji: "👵", label: "Ask family to help", sub: "Free, but a bit chaotic", fb: "Grandma's back on the till! Cheap, cheerful and a bit chaotic." },
      smaller: { emoji: "📋", label: "Sell a smaller range", sub: "Easier to run, fewer sales", fb: "A shorter menu is easier to manage with fewer people." },
      nothing: { emoji: "😓", label: "Struggle on", sub: "Free, but service suffers", fb: "Long waits and mistakes. Customers notice." },
    },
  },
  bigorder: {
    emoji: "📦", title: "A huge order comes in!",
    text: s => `A local company wants a massive order of ${productName(s)} for an event.`,
    responses: {
      accept: { emoji: "🤝", label: "Accept it", sub: "Big one-off profit, normal customers wait a bit", fb: "Delivered on time. That's a nice chunk of cash!" },
      rush: { emoji: "🏃", label: "Accept and rush it", sub: "Squeeze in even more, quality slips", fb: "You took on extra, but rushed work earned some complaints." },
      contract: { emoji: "📝", label: "Offer a discount for a regular deal", sub: "Less now, steady orders all year", fb: "They're now a regular customer. Steady money all year!" },
      decline: { emoji: "🙅", label: "Turn it down", sub: "Keep things simple", fb: "You stayed focused, but left money on the table." },
    },
  },
  chain: {
    emoji: "🏢", title: "A big chain moves in",
    text: s => `A national chain starts selling ${productName(s)} for less. Some of your customers drift away.`,
    responses: {
      match: { emoji: "🏷️", label: "Match their prices", sub: "10% lower prices", fb: "You matched them, but you can't beat a giant on price." },
      story: { emoji: "❤️", label: "Shout about being local and independent", sub: "£800 campaign", fb: "People love backing a local business over a big chain!" },
      range: { emoji: "🆕", label: "Launch something they don't sell", sub: "£1,500 to stand out", fb: "Your new range gives people a reason to choose you." },
      nothing: { emoji: "🤞", label: "Carry on", sub: "Free", fb: "Some customers left for the chain and didn't come back." },
    },
  },
  festival: {
    emoji: "🎪", title: "A festival comes to town!",
    text: "A big music festival is coming for a month. Thousands of visitors!",
    responses: {
      stall: { emoji: "🎟️", label: "Run a stall at the festival", sub: "£600 pitch", fb: "Your festival stall is packed. What a month!" },
      sponsor: { emoji: "📣", label: "Sponsor the main stage", sub: "£1,000, your name everywhere", fb: "Your name is on the main stage. Everyone knows you now." },
      hours: { emoji: "🌙", label: "Open late", sub: "£400 extra in wages, serve more", fb: "Late-night festival crowds keep you busy." },
      nothing: { emoji: "🎧", label: "Business as usual", sub: "Free", fb: "A few festival-goers wander in, but you missed a trick." },
    },
  },
  inflation: {
    emoji: "📈", title: "Prices are rising",
    text: "Inflation hits: your stock costs 15% more for the next six months.",
    responses: {
      raise: { emoji: "💷", label: "Raise your prices", sub: "8% higher prices", fb: "Everyone's raising prices, so most customers understand." },
      shrink: { emoji: "🤏", label: "Make portions smaller", sub: "Same price, less product", fb: "Customers spotted the 'shrinkflation' and they're not happy." },
      switch: { emoji: "🔄", label: "Switch to cheaper stock", sub: "Saves money, quality dips", fb: "Cheaper stock saves money, but a few regulars notice." },
      nothing: { emoji: "😬", label: "Absorb the cost", sub: "Keep prices the same", fb: "You kept prices steady. Customers are pleased, your profit isn't." },
    },
  },
  celebrity: {
    emoji: "🌟", title: "A celebrity drops by!",
    text: s => `A famous footballer is spotted buying your ${productName(s)}. Everyone's talking about you!`,
    responses: {
      post: { emoji: "📸", label: "Post the photo everywhere", sub: "Free", fb: "The photo gets thousands of likes. Free advertising!" },
      special: { emoji: "⚽", label: "Name a product after them", sub: "£200 to launch", fb: "Fans are queuing for the special edition!" },
      advert: { emoji: "🎬", label: "Pay them for an advert", sub: "£1,500", fb: "A celebrity advert! Customers come from miles around." },
      nothing: { emoji: "🤐", label: "Keep it low-key", sub: "Free", fb: "Classy, but you could have made more of it." },
    },
  },
  flood: {
    emoji: "🌧️", title: "Your shop floods!",
    text: "A storm floods your storeroom. £2,500 of damage, and you're half closed for a month.",
    responses: {
      insurance: { emoji: "📄", label: "Claim on your insurance", sub: "Get £2,000 back", fb: "Insurance pays out. That's why businesses have it!" },
      crowdfund: { emoji: "🤲", label: "Ask the community for help", sub: "Locals chip in about £1,200", fb: "The town rallied round to help you. What a community!" },
      quickfix: { emoji: "🧹", label: "Pay for a quick clean-up", sub: "£400, reopen fast", fb: "A quick clean-up gets you trading again in days." },
      nothing: { emoji: "😞", label: "Cope as best you can", sub: "Free", fb: "A tough month. You got through it, just about." },
    },
  },
  costliving: {
    emoji: "👛", title: "Money is tight for everyone",
    text: "A cost-of-living crisis means customers have less to spend for six months.",
    responses: {
      value: { emoji: "🏷️", label: "Launch a budget range", sub: "10% cheaper, more customers", fb: "A budget range keeps customers coming, but you earn less on each sale." },
      deals: { emoji: "🎁", label: "Meal deals and bundles", sub: "£300 to set up", fb: "Bundles make customers feel they're getting a bargain." },
      premium: { emoji: "💎", label: "Go upmarket", sub: "10% dearer, for people still spending", fb: "Some people are still spending, and they'll pay for quality." },
      nothing: { emoji: "🤷", label: "Carry on", sub: "Free", fb: "Fewer customers through the door, but you got by." },
    },
  },
};

// ---- The market each year (numbers in MARKETS in model.js) ----
const MARKET_TEXT = {
  steady: { emoji: "📊", title: "A steady year", text: "Nothing unusual is happening. A normal year for shoppers." },
  spring: { emoji: "🌧️", title: "A slow, rainy spring", text: "Shoppers are staying in and saving. Luxury and big shopping centres are hit hardest, but online shopping is up." },
  crash: { emoji: "📉", title: "Luxury crash", text: "Money is tight. Premium and luxury sales halve, and bargains sell more." },
  summer: { emoji: "☀️", title: "A long hot summer", text: "The town is buzzing. Cold treats, market stalls and pop-up vans boom; hot food suffers." },
  revival: { emoji: "🏙️", title: "High street revival", text: "People are backing local shops. High streets, colleges and markets are busy; the shopping centre is half empty." },
};
