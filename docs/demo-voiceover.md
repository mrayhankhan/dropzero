# DropZero — demo voiceover (word-for-word teleprompter, ~2:50)

## Before you hit record
- Open **dropzero.vercel.app** in a clean browser window (hide bookmarks bar + extensions).
- Confirm the homepage badge reads **"Aurora DSQL · eu-north-1."**
- Make sure the drop you'll demo on shows **full inventory** (e.g. "Zero Stack Hoodie — Founder's Drop" at 500 / 500). If nothing is full, open **/admin** and create a fresh one (total 500, price 6400, status live) right before recording — because running the stampede sells it out.
- Record the browser only (`Cmd+Shift+5` → record selected window). Keep it **under 3:00**. Speak at a natural pace.

---

## Script (just read it — [brackets] are what to do, not what to say)

**[0:00 — homepage; cursor near the "Aurora DSQL · eu-north-1" badge and the moving live tape]**

Hi — this is DropZero. Every time something popular goes on sale — concert tickets, a sneaker drop, a limited product launch — the same thing happens to somebody: you get the confirmation, and then, minutes later, the "sorry, it was actually sold out" email. That's called overselling, and it's everywhere. DropZero makes it impossible — at global scale. It runs on Amazon Aurora DSQL, and everything moving on this page right now is real purchase data, streaming live from the database.

**[0:22 — slowly scroll down past the live drops, the "How it works" cards, and the comparison table]**

A seller launches a limited drop — tickets, merch, anything scarce — and buyers from all over the world rush in at the same moment. The whole trick is in how the inventory is modeled. Instead of one counter that every buyer fights over, every single unit is its own row in Aurora DSQL. Now, overselling is technically a solved problem — locks, queues, Redis counters all work — but every one of them gives up something: global speed, or strong consistency, or simple operations. Aurora DSQL is the first that gives you all three at once.

**[0:48 — scroll back up and click into a live drop showing full inventory, e.g. "Zero Stack Hoodie — Founder's Drop", 500 / 500]**

Let's look at one. This drop has five hundred units, all available. When it goes live, thousands of people can hit "buy" in the same instant. Behind the scenes, each buyer atomically claims a random, distinct unit — in a single, strongly-consistent transaction. No two people can ever get the same one.

**[1:08 — scroll to the Consistency Console; set "Concurrent buyers" to 600; click "Run stampede"]**

So let's actually prove that. I'm going to throw six hundred concurrent buyers at five hundred units — all at once.

**[pause ~1–2 seconds while the numbers render and count up]**

And there it is. Five hundred confirmed. One hundred rejected — cleanly, no errors. Oversold: zero. The integrity check — which re-counts the database to confirm nothing was double-sold — passes: verified. And look at this number: only a handful of concurrency conflicts had to retry, across six hundred simultaneous buyers, because every one of them targeted a different row. This isn't prevented by luck, or by putting people in a queue. On Aurora DSQL, it is impossible by design.

**[1:48 — open dropzero.vercel.app/architecture]**

Here's how it's put together. A Next.js front end on Vercel — co-located in Stockholm, in the same region as the database, so every query is fast. The data layer is the claim engine: it grabs a random free unit, and automatically retries if two buyers ever collide. And the system of record is Amazon Aurora DSQL — serverless, replicated across three availability zones, strongly consistent, and it scales all the way down to zero when nobody's buying.

**[2:12 — back to the app; do one normal single "Buy" on a drop; show it appear in the live activity feed; point at the seller analytics — revenue and sell-through]**

And it's a real product, not just a stress test. A single purchase confirms instantly and shows up in the live global feed, tagged by region. Sellers see live revenue, sell-through, and how fast a drop is moving. Payments are wired in with Stripe in test mode.

**[2:36 — return to the homepage, "Aurora DSQL · eu-north-1" badge in frame]**

So that's DropZero. The front end runs on Vercel, the data runs on Amazon Aurora DSQL, it's deployed, and it's proven. Zero oversells, zero cold starts, zero ops. Thanks for watching.

**[~2:55 — end]**

---

### If you fluff a line
Just pause, stop talking, and start that sentence again — you can trim the dead air later, or most people won't even notice. Don't restart the whole take.

### Word count ≈ 450 → ~2:50 at a calm pace. If you run long, the first paragraph to trim is the 0:22 "How it works" one.
