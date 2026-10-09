begin;

-- Some Supabase schemas represent uq_redemption_per_sale as a unique index
-- rather than an ALTER TABLE constraint. The previous migration only dropped
-- the constraint form, so stacked redemptions could still fail with 23505.
do $$
begin
  alter table public.loyalty_redemptions
    drop constraint if exists uq_redemption_per_sale;
exception
  when undefined_object then null;
end
$$;

drop index if exists public.uq_redemption_per_sale;

-- A coupon may be redeemed only once for a given sale, while one sale may
-- contain multiple different loyalty coupons.
create unique index if not exists uq_redemption_per_sale_coupon
  on public.loyalty_redemptions (sale_id, loyalty_coupon_id)
  where loyalty_coupon_id is not null;

commit;
