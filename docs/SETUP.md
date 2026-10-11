# Goldstar Banepa Loyalty setup

## 1. Connect the existing Supabase project

Open the app without credentials. The Connect your database screen accepts the Supabase Project URL and the browser-safe publishable/anon key. Use **Test connection** before **Save and reload**. The app stores only these two values in localStorage when environment variables or `src/config/public-config.ts` are not present.

The app never creates tables, views, RPCs, triggers, policies, seed data, demo records, or migrations. Apply the database contract from the product specification in the user’s existing Supabase project before expecting operational screens to show records.

## 2. Create the first administrator

Create the first user in Supabase Authentication with an email and password. Add the same auth user id to `staff_profiles` with `full_name`, `role = 'admin'`, an active showroom id, and `is_active = true`. The app intentionally has no public sign-up form.

## 3. Deploy Edge Functions

From the repository root, deploy the three functions with the Supabase CLI:

```bash
supabase functions deploy send-sms
supabase functions deploy daily-job --no-verify-jwt
supabase functions deploy create-staff
```

Set these Supabase secrets in the project dashboard or CLI: `SMS_PROVIDER` (`none` or `sparrow`), `SMS_API_TOKEN`, `SMS_SENDER_ID`, and `CRON_SECRET`. Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into the Edge Function runtime. The service-role key must never be copied into frontend code or Vite environment variables.

`send-sms` runs a manager-only queued/failed batch and respects customer SMS consent. `none` is a dry-run adapter that marks messages sent with provider id `dry-run`. `sparrow` is the production adapter and sends Nepali mobile numbers as 10 digits.

## 4. Schedule the daily job

Use Supabase `pg_cron` and `pg_net` to invoke `daily-job` at 02:15 UTC, which is 08:00 in Nepal during the project’s fixed Asia/Kathmandu business schedule. Store the project URL and cron secret in the database vault or the scheduler’s protected configuration; do not hard-code them in the app.

```sql
select cron.schedule(
  'goldstar-daily-job',
  '15 2 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-job',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'YOUR_CRON_SECRET'
    ),
    body := '{"scheduled":true}'::jsonb
  );
  $$
);
```

Replace placeholders in the protected scheduler environment before running the SQL. The function rejects requests without a constant-time matching `Authorization: Bearer <CRON_SECRET>` header.

## 5. Health checks

The admin **Setup / health** route checks the connection, authenticated user/profile, readable contract tables/views, `loyalty_settings` id 1, wheel/tier/template counts, RPC presence and Edge Function ping behavior. A PGRST202 “function not found” result is a failed RPC check; any other raised business error means the function exists and is reachable.

## 6. Operational notes

The browser is responsible for presentation and input validation only. Totals, discount math, birthday coupon validation, loyalty counting, ledger changes and spin results remain database-owned. Receipt totals must be read back from the `sales` row after completion. All “today” logic and displayed dates use Asia/Kathmandu, and currency uses `Rs.` with Indian digit grouping.

## Loyalty coupon migration

Apply `supabase/migrations/20261007084500_loyalty_coupons.sql` and then `supabase/migrations/20261007090500_loyalty_coupon_sum_and_reconcile.sql` to the connected Supabase project. It adds `loyalty_coupons`, links redemptions with `loyalty_coupon_id`, and exposes:

- `issue_loyalty_coupons(customer_id)`: reconciles completed cycles and issues one 15% code per cycle.
- `redeem_loyalty_coupon_stack(sale_id, coupon_codes[])`: validates ownership and availability, sums all selected 15% codes server-side (capped at 100%), updates the price/discount totals, and marks every code redeemed.

The Setup / health screen checks the table plus both RPC endpoints. The **Customers** page is the primary workflow: open a customer, add products/sizes/prices and loyalty pairs, then apply all available discount codes. Payment-method selection is intentionally removed from the loyalty UI; the underlying legacy sales record uses the neutral `other` value only because that existing table requires a payment-method field.


## Stacked loyalty redemption constraint fix

Apply `supabase/migrations/20261009081000_allow_stacked_loyalty_redemptions.sql` after the loyalty-coupon migrations. A sale may redeem multiple loyalty coupons, so redemption uniqueness is enforced per `(sale_id, loyalty_coupon_id)` rather than per sale. If a client-side loyalty save fails after creating a sale, the app marks that incomplete sale `voided` so a retry does not leave an extra completed record.

## Local Supabase environment variables

For local development, create `.env.local` in the project root. Vite loads this file automatically at startup:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

`VITE_SUPABASE_ANON_KEY` is also accepted as an alias for the key. Only publishable/anon keys belong in browser environment variables; never put a Supabase service-role key in `.env.local`. Restart the Vite server after changing `.env.local`. The connection screen remains available as a fallback when the variables are absent.
