# DropZero — demo narration (short & conversational · ~2–2½ min)

You're filming yourself on your phone and syncing it over a silent Mac screen
recording in the editor — so the **clicks/screen stay exactly the same as before**,
this is just tighter, more natural narration. Each block is tagged with *what's on
screen* at that moment so you can line it up.

## On-screen actions (unchanged — your existing screen recording)
1. Homepage (badge "Aurora DSQL · eu-north-1" + live tape)
2. Scroll down (drops → how it works → comparison table)
3. Click into a drop with full inventory (e.g. Hoodie 500/500)
4. Consistency Console → set 600 buyers → Run stampede
5. Open /architecture
6. One normal Buy → live feed + seller analytics
7. Back to homepage (badge in frame)

---

## Narration (just talk — keep it relaxed but moving)

**[on screen: homepage, badge + live tape]**
This is DropZero. Big ticket sales always end with someone getting that "sorry — actually sold out" email. That's overselling, and DropZero makes it impossible, worldwide. It runs on Amazon Aurora DSQL, and everything moving here is live data, straight from the database.

**[on screen: scrolling — drops, how it works, comparison table]**
Sellers drop limited stuff, and everyone buys at the same second. The trick? Instead of one counter everyone fights over, every single unit is its own row in DSQL. Other fixes trade away either speed, consistency, or simplicity — Aurora DSQL gives you all three.

**[on screen: clicking into a drop, 500 / 500]**
Here's a drop — five hundred units. Each buyer claims a random, distinct one, in a single strongly-consistent transaction. Two people can never get the same unit.

**[on screen: Consistency Console → 600 buyers → Run stampede]**
So let's prove it — six hundred buyers, five hundred units, all at once.
*(let the numbers land)*
Five hundred sold, a hundred rejected, zero oversold. The integrity check passes — and almost no conflicts, even with six hundred at once, because everyone grabbed a different row. It's not luck. It's impossible by design.

**[on screen: /architecture page]**
Quick look under the hood: Next.js on Vercel, in the same region as the database. The claim engine grabs a unit and retries if there's ever a collision. And Aurora DSQL is the source of truth — serverless, replicated across three zones, strongly consistent, scales to zero.

**[on screen: one normal Buy → live feed + seller analytics]**
And it's a real product, not just a stress test — a normal buy confirms instantly, pops into the live feed by region, with live seller revenue and sell-through. Payments are wired in too.

**[on screen: stay on the app / homepage — the "where this goes" moment]**
And honestly, it's not just tickets. Anywhere a crowd grabs for limited slots at once — college course registration, government visa and appointment slots, vaccine sign-ups, ERP inventory — those are the systems that crash or double-book every year. DropZero makes oversell-proof allocation of any scarce resource just a few lines of SQL.

**[on screen: homepage, badge in frame]**
That's DropZero — front end on Vercel, data on Amazon Aurora DSQL, live and proven. Zero oversells, zero ops. Thanks for watching.

---

## Tips
- ~300 words → about **2 to 2½ minutes** at a relaxed pace. Keep moving; don't linger between lines.
- You say **"Amazon Aurora DSQL"** at the start and end, and DSQL throughout — that covers the "name the database out loud" requirement.
- **Syncing:** match the start of each block to the matching screen moment; the *(let the numbers land)* pause is where you go quiet while the stampede result counts up.
- If you flub a line, just re-say that one sentence — you'll cut the gap in the editor.
