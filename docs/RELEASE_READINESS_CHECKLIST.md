# Goldstar Banepa Loyalty — EOD Release Readiness Checklist

Use this checklist with a connected Supabase project and an admin/manager test account. Do not test destructive actions against production customer data without a restore plan.

## P0 — Must pass before client handoff

### Environment and security

- [ ] Apply every migration in order, including `20261009094100_issue_reward_on_tenth_pair.sql`, `20261009082300_drop_legacy_redemption_uniqueness.sql`, and `20261010093000_regular_lucky_draw.sql`.
- [ ] `/setup` passes connection, authentication, database tables, loyalty RPCs, loyalty settings, and supporting configuration checks.
- [ ] Browser code contains only the Supabase Project URL and publishable/anon key; no service-role key or provider secret is exposed.
- [ ] Production Supabase RLS policies allow only authenticated staff/manager/admin access as intended.
- [ ] The first admin can sign in, inactive staff see the approval screen, and sign out clears the session.
- [ ] Edge Function secrets are configured outside the browser; SMS is either intentionally disabled or tested with a provider sandbox.

### Customers and loyalty

- [ ] Add customer validates Nepali phone format, duplicate phones, required name, birthday, and consent.
- [ ] Add customer requires the initial product, size, pair quantity, and price; saving creates the customer and first loyalty purchase together, shows confirmation, and redirects to the customer profile.
- [ ] Customer search works by partial phone and misspelled name; empty, loading, and error states are visible.
- [ ] A 9/10 customer has no loyalty discount before the qualifying pair is added.
- [ ] The 10th qualifying pair shows a 15% reward at the discount step, applies the discount to the eligible 10th pair, updates the cycle, and does not issue the reward twice.
- [ ] A customer with multiple completed cycles has one issued 15% coupon per completed cycle; all issued coupons can be selected and summed on one eligible purchase.
- [ ] A redeemed loyalty coupon is removed from future choices and cannot be redeemed again.
- [ ] Birthday coupons are date-limited, one-use, QR-verifiable, shareable, and cannot stack with loyalty discounts under the one-discount rule.
- [ ] Save loyalty record always ends with a visible success or error state; success redirects to Customers and refreshes purchase, pairs, coupons, and redemption data.
- [ ] Failed saves void the incomplete sale and allow a clean retry without duplicate redemptions.

### Separate RegularLuckyDraw campaign

- [ ] Apply `20261010093000_regular_lucky_draw.sql` and then `20261010094500_regular_lucky_draw_daily_customers.sql`; confirm the table and RPCs are reachable from `/setup`.
- [ ] Manager/admin can open **RegularLuckyDraw**; cashier access is intentionally denied.
- [ ] Selecting a date and generating tickets creates exactly one ticket only for customers with a completed purchase on that date in Asia/Kathmandu; customers who did not buy that day receive no ticket, and running generation again is idempotent.
- [ ] Tickets are numbered in first-come order as `GSB-RLD-yyyymmdd-01`, `GSB-RLD-yyyymmdd-02`, and so on, and include customer name/phone, draw date context, and a print-friendly card/register layout.
- [ ] Staff can physically select a hardcopy ticket and record exactly one winner for the day with an optional prize note.
- [ ] Winner history remains visible after refresh; selecting a replacement winner does not create a second active winner.
- [ ] Lucky-draw tickets, winners, and prize notes never change sales, loyalty pairs, loyalty coupons, birthday coupons, discounts, or customer reward readiness.

## P1 — Production-quality verification

### Responsive and accessibility

- [ ] Test at 360px, 390px, 768px, 1024px, and desktop width.
- [ ] No horizontal page overflow; tables use intentional horizontal scrolling inside their panels.
- [ ] Mobile bottom navigation, menu drawer, dialogs, date controls, search, forms, and save buttons are reachable with a thumb.
- [ ] Light mode and dark mode have readable text, borders, input values, badges, disabled/loading states, and modal overlays.
- [ ] Keyboard focus is visible; buttons and inputs have clear labels; destructive or irreversible actions have confirmation/visible outcome.
- [ ] Print preview for RegularLuckyDraw hides navigation and produces clean ticket cards on paper.

### Operational flows

- [ ] Birthday message text is editable, consent is respected, queue/send/retry states are visible, and failed delivery is actionable.
- [ ] CSV import preview does not write data; staging/process/error paths are connected to the database before promising import completion.
- [ ] Sales/customer lists paginate or intentionally limit results, and all empty/loading/error states are usable.
- [ ] Admin settings, staff creation, audit log, and void/reversal flows either work end-to-end or are explicitly disabled before handoff; placeholder buttons must not imply a completed action.
- [ ] Reports show database-backed values or are labeled as unavailable; no hard-coded demo metrics remain.

## Final handoff evidence

- [ ] Record the deployed commit SHA and Supabase migration status.
- [ ] Capture one successful 10th-pair sale, one stacked-coupon redemption, one birthday QR redemption, and one RegularLuckyDraw ticket/winner record.
- [ ] Confirm backup/rollback ownership with the client.
- [ ] Confirm client knows that the daily lucky draw is physical and the app is only for ticket generation and winner history.
