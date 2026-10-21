# Be the Boss

An open evening game for Business Studies. Students make 8 decisions: what to sell (10 products), then location, price, supplier, staff, marketing, ethics, and how to react to a rival (6 options each). Each choice adds to a picture of their shop and moves live meters for customers, reputation and profit. At the end they get their year-one profit, a star rating, a money-in vs money-out chart, the business ideas behind their result (capacity, fixed costs, profit margin, differentiation and so on) and their rank for the night.

A live dashboard at `/dashboard` shows how everyone has done all evening: totals, top 10, what people sold, what they chose at each step, star ratings, and the choice that made the biggest difference.

Plain HTML, CSS and JavaScript plus a small Node server with no dependencies.

## Privacy

Nobody types anything. Business names are picked at random from a list. The server stores only the 8 choices, the random business name and the time of each game. It does not store or log names, IP addresses, device details or cookies. Results are held in memory and dropped after 24 hours, or when you reset. (Render itself keeps standard request logs on its side, as any host does.)

## Run it locally

```
node server.js
```

Game: http://localhost:3000 · Dashboard: http://localhost:3000/dashboard

## Put it on Render

1. Push this repo to GitHub and merge into `main`.
2. In Render: **New + → Blueprint**, pick this repo. Render reads `render.yaml` and creates a free web service called `be-the-boss` with a random `ADMIN_KEY`.
   (Or **New + → Web Service**, pick the repo, Build Command `echo`, Start Command `node server.js`, and add an `ADMIN_KEY` environment variable.)
3. Every push to `main` redeploys it automatically.

## On the night

- **Open the dashboard on the big screen first**, about 10 minutes before doors open. Render's free plan puts the app to sleep after 15 minutes with no visitors and takes up to a minute to wake. The dashboard checks in every few seconds, so it keeps the app awake all evening.
- Results live in the server's memory, so a restart or redeploy clears them on the server. The dashboard keeps its own copy in its browser, so the big screen keeps showing the whole evening anyway. Don't push changes during the event.
- If the wifi drops, game devices save finished games and send them when the connection comes back.
- **Reset before the event** to clear any test games: on the dashboard press **Shift+R** and enter the `ADMIN_KEY` (find it in Render → be-the-boss → Environment).
- If nobody touches a game screen for 90 seconds it goes back to the start screen.
- Full screen: F11 (Windows) or Ctrl+Cmd+F (Mac). On an iPad, "Add to Home Screen" hides the browser bar.

## Changing things

- Wording at the top of `public/game.js` (`CONFIG`): the subtitle, closing message, idle timeout, how long each feedback card stays up.
- The questions, option names and feedback text: `public/options.js` (the game and the dashboard both read it). The product question is in `STEPS` in `public/game.js`.
- Adding an option means adding it in `public/options.js` and giving it numbers under the same id in `public/model.js`.
- Products, business names and all the numbers (prices, rent, wages, demand): `public/model.js`. After changing them, run `node tools/sim.js` to play all 2.8 million possible games (takes a few seconds) and check the spread of star ratings and that no product is far ahead of the rest.
