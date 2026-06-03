# Devpost submission checklist — H0 Hackathon

Deadline: **Jun 29, 2026, 5:00pm PT** (submission period). Judging through Jul 24.
Submit early; keep the app live and free to access through judging.

## Required fields

- [ ] **Track:** Track 3 — Million-scale Global App *(entertainment/commerce, scale story)*
- [ ] **Which AWS Database:** **Amazon Aurora DSQL** (state this explicitly)
- [ ] **Text description** — what it does, who it's for, why DSQL. Reuse the README
      intro + the "insight" section.
- [ ] **Demo video (< 3 min, public on YouTube)** — follow `docs/demo-script.md`.
      Must show the working app and **say "Amazon Aurora DSQL" out loud**.
- [ ] **Published Vercel project link** (`*.vercel.app`, live and public).
- [ ] **Vercel Team ID** — Vercel → your team → Settings → General → "Team ID".
- [ ] **Architecture diagram** — export the `ARCHITECTURE.md` diagram to PNG via
      draw.io with official AWS + Vercel icons.
- [ ] **Storage configuration screenshot** — the v0/Vercel Storage page showing the
      Aurora DSQL integration (this is how you *prove* DSQL usage).
- [ ] **Public code repo** — no secrets committed (`.gitignore` covers `.env*`).

## Bonus points (up to +0.6 — do all three)

- [ ] Publish `docs/blog-post-1.md` (dev.to / Medium / LinkedIn / builder.aws.com).
- [ ] Publish a 2nd piece (e.g., a LinkedIn writeup or a short YouTube build log).
- [ ] Publish a 3rd piece (e.g., a Twitter/X thread or a second article angle).
- [ ] Each must be **public (not unlisted)**, include the "I created this for the
      H0 hackathon" line, and use **#H0Hackathon** on social posts.

## Pre-submit verification

- [ ] Live URL loads; badge reads **"Aurora DSQL · <region>"** (not "Preview mode").
- [ ] Create a drop in the seller console → it persists after refresh (real DB).
- [ ] **Run stampede** on the live deployment → `oversold: 0`, low `conflicts`.
- [ ] A normal single Buy works and shows in the live activity feed.
- [ ] `npm run build` passes locally with no type errors.
- [ ] Repo README explains setup + how it was built during the submission period.

## Scoring map (why each criterion is covered)

| Criterion | Where it's earned |
|---|---|
| Technical Implementation | Discrete-unit claim model + OCC retry; deliberate DSQL-shaped schema; keyless OIDC auth |
| Design | Cohesive dark UI; the sim result as the visual climax; backend state surfaced honestly |
| Impact & Applicability | Shippable flash-sale engine for any scarce resource; multi-region scale story |
| Originality | A *correct* DSQL concurrency design (rare); the simulator as live proof |

## Two paths to a prize from one build
1. **Track 3** placement (1st/2nd/3rd).
2. **Best Technical Implementation** Best-of prize — the concurrency engineering is
   the strongest pitch for it.
