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
const priceFor = (s, id) => PRODUCTS[s.product].prices[PRICES[id].of] * PRICES[id].mult;
const isFood = s => PRODUCTS[s.product].staff[0] === "🧑‍🍳";

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
        sub: "Tiny rent, but apps take 15% of sales", fb: "Hardly any rent! But nobody walks past a website. People need to find you." },
    ],
  },
  {
    key: "price", name: "Price", icon: "💷", title: "How much will you charge?",
    options: [
      { id: "rock", emoji: "📉", label: "Rock bottom", short: "Rock bottom", phrase: "charged rock-bottom prices",
        sub: s => `${pounds(priceFor(s, "rock"))} ${unitWord(s)}. Cheapest in town` },
      { id: "low", emoji: "🏷️", label: "Bargain", short: "Bargain", phrase: "charged bargain prices",
        sub: s => `${pounds(priceFor(s, "low"))} ${unitWord(s)}. Crowds love a deal` },
      { id: "pwyw", emoji: "🤲", label: "Pay what you want", short: "Pay what you want", phrase: "let people pay what they want",
        sub: s => `Most pay about ${pounds(priceFor(s, "pwyw"))}. People love it` },
      { id: "mid", emoji: "⚖️", label: "Fair price", short: "Fair", phrase: "charged a fair price",
        sub: s => `${pounds(priceFor(s, "mid"))} ${unitWord(s)}. Same as most places` },
      { id: "high", emoji: "💎", label: "Premium", short: "Premium", phrase: "charged premium prices",
        sub: s => `${pounds(priceFor(s, "high"))} ${unitWord(s)}. Fewer buyers, more profit each` },
      { id: "luxury", emoji: "👑", label: "Luxury", short: "Luxury", phrase: "charged luxury prices",
        sub: s => `${pounds(priceFor(s, "luxury"))} ${unitWord(s)}. Only for the few` },
    ],
    fb: (s, r) => {
      const margin = r.price - r.unitCost;
      if (margin <= 0) return { emoji: "😱", text: `Uh oh! Each sale costs you ${pounds(r.unitCost)} to make, so you <b>lose money</b> every time you sell one.` };
      return {
        rock: `So cheap! Queues for days, but you only keep ${pounds(margin)} from each sale.`,
        low: `Cheap! More customers, but you only keep ${pounds(margin)} from each sale.`,
        pwyw: `People love choosing! Most pay a bit less than normal, so you keep about ${pounds(margin)} each.`,
        mid: `A fair price. You keep ${pounds(margin)} from each sale after paying for stock.`,
        high: `You keep ${pounds(margin)} from each sale. Customers will expect it to be amazing.`,
        luxury: `You keep a huge ${pounds(margin)} from each sale, but most people can't afford it.`,
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
