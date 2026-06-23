# Dubai Petsitters (Next.js + Supabase)

Next.js TypeScript app migrated from the [saudi-petsitters](../saudi-petsitters) Vite/Base44 reference, with Supabase as the backend.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** (Auth, Postgres, RLS)
- **TanStack React Query**

## Getting started

```bash
npm install
cp .env.example .env.local
# Add your Supabase URL and anon key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create or use an existing Supabase project.
2. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env.local`.
3. Apply migrations:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migrations live in [`supabase/migrations`](supabase/migrations).

## Project structure

| Path | Purpose |
|------|---------|
| `src/app/(main)/` | App Router pages |
| `src/components/pages/` | Ported page components |
| `src/components/layout/` | Navbar, footer, mobile tabs |
| `src/lib/data/` | Supabase entity client (replaces Base44 SDK) |
| `src/features/*/queries.ts` | Domain query helpers |
| `supabase/migrations/` | Database schema + RLS |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
