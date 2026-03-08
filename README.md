# MealMate Web

MealMate is a full-stack web app that tracks student meal swipes by reading Grubhub receipt emails through the Gmail API.
Users sign in with Google OAuth, view weekly usage, rescan email history, and manage their account data.

## Features

- Google OAuth sign-in with offline Gmail access (`gmail.readonly`)
- Automatic sync of meal swipe receipts from Gmail
- Weekly swipe summary and recent meal history dashboard
- Manual rescan with server-side rate limiting
- Account data controls:
  - Disconnect Gmail and remove stored swipe data
  - Delete account and associated data
- Privacy Policy and Terms pages

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- NextAuth.js (Google provider, database sessions)
- Prisma ORM + PostgreSQL (Supabase-compatible)
- TanStack Query for client data fetching and caching
- Tailwind CSS
- GitHub Actions CI (`lint` + `build`)
- Vercel deployment

## Project Structure

```text
app/
  api/
    auth/[...nextauth]/route.ts   # auth + token persistence
    swipes/route.ts               # summary + rescan endpoints
    history/route.ts              # meal history endpoint
    account/route.ts              # disconnect/delete account endpoints
  page.tsx                        # dashboard
  history/page.tsx                # history view
  privacy/page.tsx                # privacy policy
  terms/page.tsx                  # terms of use
  lib/
    db.ts                         # Prisma client
    grubhub.ts                    # Gmail scan + parsing
    swipeStore.ts                 # sync/cache logic
prisma/
  schema.prisma
  migrations/
.github/workflows/ci.yml
```

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # optional fallback used by prisma config

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-strong-random-secret"
```

Notes:

- For production, set `NEXTAUTH_URL` to your live domain (for example, `https://mealmate-usc.com`).
- Add the same variables in Vercel Project Settings -> Environment Variables.

## Local Development

```bash
npm ci
npx prisma migrate deploy
npm run dev
```

App runs at `http://localhost:3000`.

## Build and Quality Checks

```bash
npm run lint
npm run build
```

CI runs these checks automatically on every push and pull request.

## Deployment (Vercel)

1. Import the repo into Vercel.
2. Add all required environment variables.
3. Deploy.
4. After deploying schema changes, run:

```bash
npx prisma migrate deploy
```

## Data Handling

MealMate stores only the data needed to provide the product:

- User and auth records (NextAuth + Prisma)
- Gmail OAuth tokens required for syncing
- Parsed meal swipe events and metadata

Users can remove their data at any time via in-app account controls.
