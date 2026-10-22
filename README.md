# Z-FRUITS
A campus fruit reservation website. UGX 2,000 per pack, payment at pickup.

## Owner setup
Set the Sites runtime environment variable ADMIN_EMAILS to comma-separated shop team ChatGPT sign-in emails, then redeploy. Visit /admin and sign in. Set pickup location, hours, available stock (e.g. 50), and enable bookings. The shop starts with zero available packs so it cannot accept unfulfillable reservations.

Customer bookings are stored in D1. Stock reservation uses a conditional INSERT followed by an update in one D1 transaction. Retrying the same booking ID does not double reserve. Cancellation returns stock once; collection does not change available stock. Contact details are visible only to the configured owner.

The site is initially owner-private. Public sharing must be enabled in Sites before students can use it. Do not expose an unconfigured shop. This app does not send SMS or collect online payments.

Use npm run dev for development. Generate migrations with npm run db:generate. Hosted publishing applies migrations. Local preview needs migration application using Wrangler as described in the starter documentation.


