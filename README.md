# Be the Boss

An open evening game for Business Studies. Students make 8 decisions (product, location, price, supplier, staff, marketing, ethics, and how to react to a rival). Each choice adds to a picture of their shop and moves live meters for customers, reputation and profit. At the end they get their year-one profit, a star rating, a money-in vs money-out chart, the business ideas behind their result (capacity, fixed costs, profit margin, differentiation and so on) and a "tonight's top businesses" leaderboard.

Plain HTML, CSS and JavaScript. No build step, no server, no accounts.

## Run it locally

Open `public/index.html` in a browser, or:

```
cd public && python3 -m http.server 8000
```

then go to http://localhost:8000.

## Put it on Render

1. Push this repo to GitHub.
2. In Render: **New + → Blueprint**, pick this repo. Render reads `render.yaml` and creates a free static site called `be-the-boss`.
   (Or **New + → Static Site**, pick the repo, leave Build Command blank or `echo`, set Publish Directory to `public`.)
3. Every push to the branch Render watches redeploys the site automatically.

## On the night

- The leaderboard is stored in each device's browser and resets every day. Run it on one laptop or iPad per table so the leaderboard builds up across the evening.
- If nobody touches the screen for 90 seconds it goes back to the start screen.
- Press F11 (Windows) or Ctrl+Cmd+F (Mac) for full screen. On an iPad, "Add to Home Screen" hides the browser bar.

## Changing things

- Wording at the top of `public/game.js` (`CONFIG`): the subtitle, the closing message, the idle timeout, how long each feedback card stays up.
- The questions and the feedback text: `STEPS` in `public/game.js`.
- The numbers (prices, rent, wages, demand): `public/model.js`. After changing them, run `node tools/sim.js` to play all 6,561 possible games and check the spread of star ratings is still sensible (roughly a quarter of players should make a loss).
