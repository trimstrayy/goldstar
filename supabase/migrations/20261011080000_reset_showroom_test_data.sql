begin;

-- Goldstar Banepa production-start reset.
-- Deletes customer and operational/test records only.
-- Preserves auth users, staff_profiles, showrooms, loyalty settings,
-- birthday tiers, wheel segments, message templates, and schema objects
-- so the showroom can begin operating without locking out staff.

-- Dependent operational records first.
delete from public.loyalty_redemptions;
delete from public.regular_lucky_draw_tickets;
delete from public.message_log;
delete from public.birthday_coupons;
delete from public.loyalty_coupons;
delete from public.loyalty_ledger;
delete from public.sale_items;
delete from public.sales;
delete from public.legacy_import_staging;
delete from public.audit_log;

-- Customer records last.
delete from public.customers;

commit;
