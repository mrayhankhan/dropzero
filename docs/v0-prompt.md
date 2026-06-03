# v0 prompt — polish the DropZero UI

The functional UI already exists in this repo. Use v0 to elevate the **visual
design** (a judged criterion) without changing the API contract. Paste the prompt
below into [v0.app](https://v0.app), then copy components back into `components/`
and `app/`.

> **Keep these API shapes unchanged** so the backend keeps working:
> - `GET /api/drops` → `{ backend, region, drops: Drop[] }`
> - `GET /api/drops/:id` → `{ drop }`
> - `POST /api/reserve` `{ dropId, qty, buyerEmail, idempotencyKey }` → `{ order, remaining, deduped, retries, unitNos }`
> - `GET /api/feed?dropId=` → `{ orders }`
> - `POST /api/simulate` `{ dropId, buyers, qtyPer }` → `{ confirmed, soldOut, oversold, conflicts, unitsSold, total, remaining, durationMs }`
> - `Drop = { id, name, description, image_url, total, remaining, price_cents, status, ... }`

---

## Prompt

```
Build a sleek, premium dark-mode UI for "DropZero", a global live-drops / flash-
sale platform that guarantees zero overselling. Think Vercel x Linear x a high-end
ticketing brand: deep near-black backgrounds, subtle violet→cyan gradient accents,
generous spacing, crisp typography, soft glows, rounded-2xl cards, tasteful motion.

Pages:
1. Home — a hero ("Zero oversells. Global scale, instantly.") with a small status
   badge showing the live backend ("Aurora DSQL · us-east-1" or "Preview mode"),
   then a responsive grid of DropCards. Each card: name, description, an animated
   inventory progress bar (remaining/total), price, and a status pill
   (live/sold_out/scheduled). Cards subtly glow on hover.
2. Drop detail — large title + price, a big animated "remaining / total" indicator
   with a live percentage, a primary Buy panel (email + quantity + buy button with
   the total price), a real-time "Live activity" feed of recent purchases (masked
   emails + region chips + relative time), and a highlighted "Sellout simulation"
   card with a "Run stampede" button and a results grid. In the results, make the
   "Oversold = 0" and "OCC conflicts = 0" stats large and green — they are the hero
   metrics. Show a success banner summarizing the run.
3. Seller console — a create-drop form (name, description, inventory, price) and a
   list of existing drops with inline status controls.

Use Tailwind, React, Next.js App Router, and SWR for ~1.2s live polling. Keep it
fast and accessible. Use the exact API endpoints and data shapes provided above —
do not invent new fields. Make the sellout-simulation result the visual climax of
the product.
```

---

## After generating
- Diff v0's components against the existing ones; keep the API calls intact.
- Re-run `npm run dev` and the **Run stampede** flow to confirm nothing broke.
- Screenshot the **Storage configuration** page in v0/Vercel (proves Aurora DSQL)
  for the submission.
