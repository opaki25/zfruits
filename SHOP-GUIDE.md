# Daily shop operations

- Sign in at `/login` using one of the configured team's Supabase email/password accounts.
- Enter unreserved packs available now. Saving 50 makes 50 packs available; existing reservations are separate.
- Keep Accept bookings enabled during sales. Zero stock prevents new bookings. Availability follows stock, with no fixed opening hours.
- Pickup is at the Z-FRUITS shop on campus. You can edit pickup instructions in the dashboard.
- If stock changed while you were editing, refresh and enter the current physical count again.
- Mark Collected after pickup. Cancel returns a reservation's packs to available stock exactly once.
- Students pay UGX 2,000 per pack at pickup. No online payment or automatic SMS is included.
- Refresh the dashboard for new bookings. Customer availability refreshes every 15 seconds and is rechecked during booking.
- Reconcile uncollected reservations and remaining fresh packs before starting the next selling day. Bookings do not expire automatically.
- The Vercel website is intended for public customer access. The dashboard and customer contacts require team login.

## Walk-in sales and daily totals

- In Daily sales, choose the selling date (Uganda time) and enter packs sold to customers who did not book online. You can record individual sales or a whole day's unrecorded walk-in total.
- The default option deducts these packs from available stock. If you already reduced stock manually, select Stock already adjusted to avoid deducting twice. Historical entries should usually use this option.
- Each pack is UGX 2,000. Daily totals combine non-voided shop sales with bookings collected that day. Never enter collected online bookings as walk-in sales.
- Void an incorrect shop entry, then record the correction. Voiding restores stock only when that entry originally deducted it. Entries remain visible for review.
- Old collected bookings from before collection timestamps were introduced remain visible in Bookings, but are excluded from daily totals because their actual pickup date is unknown.
- Database verification: supabase/tests/sales.sql checks idempotency, stock, voiding, dates, collection totals, and access restrictions; its test changes roll back.
