begin;

-- A single sale may redeem multiple loyalty coupons. The previous constraint
-- allowed only one loyalty_redemptions row per sale and caused stacked-coupon
-- redemption to fail with uq_redemption_per_sale.
alter table public.loyalty_redemptions
drop constraint if exists uq_redemption_per_sale;

-- Keep each coupon-to-sale redemption unique while allowing multiple coupons
-- on the same sale. PostgreSQL unique indexes permit multiple NULL values, so
-- non-coupon redemption rows remain unaffected by this index.
create unique index if not exists uq_redemption_per_sale_coupon
  on public.loyalty_redemptions (sale_id, loyalty_coupon_id)
  where loyalty_coupon_id is not null;

commit;
