# Z-FRUITS

Simple campus fruit reservations, UGX 2,000 per pack, paid at pickup.

## Production: Vercel + Supabase

This branch uses standard Next.js. `npm run build` produces `.next/routes-manifest.json` for Vercel. The previous Vinext/Cloudflare scripts and starter files are retained as historical source but are not used by the active build. Do not use `vinext build`, Wrangler, or the old Sites publishing scripts to deploy this branch.

The dedicated Supabase project is [Z-FRUITS in Code Z](https://supabase.com/dashboard/project/owrosjueeklbvtvciwnk). Its booking migration has already been applied. New stock starts at zero; records from the old Sites database are not automatically copied.

### Vercel configuration

Import `opaki25/zfruits`, use branch `main`, framework **Next.js**, Node.js **22.x**, and repository root as Root Directory. Build: `npm run build`; output: `.next`; install: `npm ci`. Clear any old Vinext command overrides. `vercel.json` contains these build settings.

Add these variables in Vercel Project Settings → Environment Variables for Production (and Preview if needed):

| Variable | Value |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | https://owrosjueeklbvtvciwnk.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | sb_publishable_C29nrHf2rqaPlnU5zG7gVQ_FbY9owIj |
| SUPABASE_SECRET_KEY | Copy the secret key from this project's Supabase Settings → API Keys |

Keep the secret key server-only. Never prefix it with `NEXT_PUBLIC_`, commit it, or paste it into chat. Redeploy after setting variables. No fixed production URL or auth callback redirect is needed: the application uses same-origin password login.

### Team accounts

In Supabase Authentication → Users, create password accounts for the following emails, with email confirmed. The account owners should choose their passwords securely. This application does not send invitations or reset emails automatically.

- opakijonathan30@gmail.com
- davidmula746@gmail.com
- busingyembeine6@gmail.com

These addresses are already on the database team allowlist. An allowlist entry alone does not create an Auth account. Visit `/login` after account setup. Anonymous visitors cannot read bookings or call privileged database functions directly; the server verifies the session and team membership for every admin request.

## Development and verification

Use Node.js 22.13 or later. Run `npm ci`, copy `.env.example` to `.env.local`, and supply the three variables above. Run `npm run dev`.

- `npm test`: booking input and same-origin validation.
- `npm run typecheck`: TypeScript validation.
- `npm run build`: production build, including Vercel's routes manifest.
- `supabase/tests/booking.sql`: transactional database assertions; run through Supabase SQL Editor. All fixture changes are rolled back.

Stock reservations use a PostgreSQL row lock and transaction to prevent overselling. Retrying the same booking ID does not reserve twice. Cancellation returns stock once; collection does not change stock. Version checks reject an owner's stale stock edit if a booking happened in the meantime.

See [SHOP-GUIDE.md](SHOP-GUIDE.md) for daily operations. No online payment, SMS, delivery, or customer account is required.
