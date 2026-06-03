# Go-live — step-by-step to a submitted entry

Everything from zero to a Devpost submission. Steps marked **[you]** need your
accounts; the rest is already done in this repo.

## 0. Accounts & credits — do this first (deadline: Jun 26, 12pm PT) **[you]**
1. Register for the hackathon on Devpost (Join Hackathon).
2. Create an **AWS account** and a **Vercel / v0** account.
3. Request the **$100 AWS + $30 v0 credits**: https://forms.gle/ozhbhvaXAxHxu3kMA
   *(closes Jun 26 — request even before the app is finished.)*

## 1. Push the repo (public) **[you]**
```bash
cd dropzero
git add -A && git commit -m "DropZero"      # already initialized for you
gh repo create dropzero --public --source=. --push   # or create on github.com and push
```
The repo must be public for judging. `.gitignore` already excludes all `.env*`.

## 2. Provision Aurora DSQL via the Vercel Marketplace **[you]**
1. Import the GitHub repo into Vercel (New Project → pick `dropzero`).
2. In the project: **Storage → Add → Amazon Aurora DSQL** (Marketplace).
3. Choose a region + plan. Vercel provisions the cluster and wires **OIDC** so the
   deployment assumes an AWS IAM role — **no access keys to paste**. It injects
   `DSQL_CLUSTER_ENDPOINT` and `AWS_REGION` as env vars.
4. (Optional) set `APP_REGION_LABEL` to a friendly string like `us-east-1`.

## 3. Initialize schema + seed (from your machine) **[you]**
```bash
cp .env.example .env.local        # paste DSQL_CLUSTER_ENDPOINT + AWS_REGION
# local AWS creds for the signer (or use `aws sso login`)
npm install
npm run db:init                   # creates tables; rewrites indexes to CREATE INDEX ASYNC
npm run db:seed                   # mints headline drops
npm run dev                       # confirm badge reads "Aurora DSQL · <region>"
```

## 4. Deploy **[you]**
`git push` (Vercel auto-deploys) or `vercel --prod`. Open the `*.vercel.app` URL and
confirm the header badge says **Aurora DSQL** (not "Preview"). Create a drop, run a
stampede on the live site → `oversold: 0`.

## 5. Capture the required artifacts **[you]**
- [ ] **Storage configuration screenshot** — Vercel → Storage → your Aurora DSQL
      integration. *(This is how you prove DSQL usage. Required.)*
- [ ] **Architecture diagram PNG** — export from `ARCHITECTURE.md` via draw.io
      (steps included there).
- [ ] **Vercel Team ID** — Vercel → your team → Settings → General → "Team ID".
- [ ] **Demo video (<3 min, public on YouTube)** — record using `docs/demo-script.md`.

## 6. Bonus content (+0.6 max) **[you]**
Publish all three drafts in `docs/` (blog-post-1, -2, -3), public + not unlisted,
each with the "created for the H0 hackathon" line; use **#H0Hackathon** on social.

## 7. Submit on Devpost **[you]**
Fill the form with: track (3), database (Aurora DSQL), the text from
`docs/devpost-description.md`, the YouTube link, the live Vercel URL, the Team ID,
the architecture PNG, and the Storage screenshot. Submit early — you can keep
editing your portfolio until the deadline.

> Verification checklist lives in `docs/submission-checklist.md`.
