# Avobloom

A cozy nutrition and health tracker built with Next.js, React and Supabase.

Live app: https://avobloom-health.vercel.app/

Public read-only demo: https://avobloom-health.vercel.app/demo . The demo uses fictional bundled examples, makes no health API requests, and provides no recording or saving controls. Personal account data remains behind authentication.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

Set the Supabase project URL and publishable/anon key in `.env.local`. Use `WELLGROVE_STORAGE=supabase` to share the same authenticated account data across local, desktop web and mobile. Configure exact OAuth callback URLs for each app origin in Supabase. Optional AI features require a server-side OpenAI API key.

Vercel automatically uses the authenticated Supabase store. Apply `supabase/migrations/202611050001_wellgrove_health.sql` to provision its account-isolated table and policies. Never expose a service-role key in browser configuration.

For an explicitly separate offline local store, set `WELLGROVE_STORAGE=sqlite`. SQLite files stay under `.health-data/` and do not sync in this mode. `WELLGROVE_MERGE_LOCAL=1` enables a one-time merge of legacy local records into the signed-in cloud account, preserving existing cloud records and settings. Enable it only on the machine/account whose records should be merged.

## Validation

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/*.test.mjs
npm run build -- --webpack
```

Food illustrations are visual references, not a source for nutritional values. Product labels remain user-reviewable before saving; missing fields are not silently treated as zero.

## Private data

The repository excludes environment secrets, local databases, health exports, screenshots, build output and temporary files. Production secrets are configured in Vercel; user records are stored in Supabase with account-level row security.
