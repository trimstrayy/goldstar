begin;

create table if not exists public.loyalty_coupons (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  cycle_number integer not null check (cycle_number > 0),
  coupon_code text not null unique,
  discount_pct numeric(5,2) not null default 15 check (discount_pct > 0 and discount_pct <= 100),
  status text not null default 'issued' check (status in ('issued','redeemed','cancelled')),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_sale_id uuid references public.sales(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  unique(customer_id, cycle_number)
);

alter table public.loyalty_redemptions add column if not exists loyalty_coupon_id uuid references public.loyalty_coupons(id) on delete set null;
create index if not exists loyalty_coupons_customer_status_idx on public.loyalty_coupons(customer_id, status);
create index if not exists loyalty_coupons_code_idx on public.loyalty_coupons(coupon_code);

alter table public.loyalty_coupons enable row level security;

drop policy if exists loyalty_coupons_staff_select on public.loyalty_coupons;
create policy loyalty_coupons_staff_select on public.loyalty_coupons for select using (public.is_staff());
drop policy if exists loyalty_coupons_staff_insert on public.loyalty_coupons;
create policy loyalty_coupons_staff_insert on public.loyalty_coupons for insert with check (public.is_staff());
drop policy if exists loyalty_coupons_staff_update on public.loyalty_coupons;
create policy loyalty_coupons_staff_update on public.loyalty_coupons for update using (public.is_staff()) with check (public.is_staff());

create or replace function public.issue_loyalty_coupons(p_customer_id uuid)
returns table(out_coupon_id uuid, out_coupon_code text, out_cycle_number integer, out_discount_pct numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_completed_cycles integer;
  v_existing integer;
  v_discount numeric;
  v_cycle integer;
  v_code text;
begin
  if not public.is_staff() then raise exception 'staff authorization required'; end if;
  select completed_cycles into v_completed_cycles from public.customer_loyalty_status where customer_id = p_customer_id;
  if v_completed_cycles is null then raise exception 'customer not found'; end if;
  select count(*) into v_existing from public.loyalty_coupons where customer_id = p_customer_id;
  select coalesce(reward_flat_discount_pct, 15) into v_discount from public.loyalty_settings where id = 1;
  for v_cycle in (v_existing + 1)..v_completed_cycles loop
    v_code := 'LY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    insert into public.loyalty_coupons(customer_id, cycle_number, coupon_code, discount_pct, created_by)
    values (p_customer_id, v_cycle, v_code, v_discount, auth.uid())
    on conflict (customer_id, cycle_number) do nothing
    returning id, coupon_code, cycle_number, discount_pct into out_coupon_id, out_coupon_code, out_cycle_number, out_discount_pct;
    if out_coupon_id is not null then return next; end if;
  end loop;
end;
$$;

grant execute on function public.issue_loyalty_coupons(uuid) to authenticated;

create or replace function public.redeem_loyalty_coupon_stack(p_sale_id uuid, p_coupon_codes text[])
returns table(out_sale_id uuid, out_coupon_count integer, out_effective_discount_pct numeric, out_discount_amount numeric, out_total_amount numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_subtotal numeric;
  v_discountable numeric;
  v_discount_factor numeric := 1;
  v_coupon record;
  v_count integer := 0;
  v_effective_pct numeric;
  v_discount_amount numeric;
  v_total numeric;
  v_staff uuid := auth.uid();
begin
  if not public.is_staff() then raise exception 'staff authorization required'; end if;
  if coalesce(array_length(p_coupon_codes, 1), 0) = 0 then raise exception 'at least one loyalty coupon is required'; end if;
  select customer_id into v_customer_id from public.sales where id = p_sale_id and status = 'completed' for update;
  if not found or v_customer_id is null then raise exception 'completed customer sale not found'; end if;
  select coalesce(sum(quantity * unit_price), 0), coalesce(sum(case when discount_eligible then quantity * unit_price else 0 end), 0)
    into v_subtotal, v_discountable from public.sale_items where sale_id = p_sale_id;
  if v_discountable <= 0 then raise exception 'sale has no discount-eligible items'; end if;
  for v_coupon in select * from public.loyalty_coupons where customer_id = v_customer_id and coupon_code = any(p_coupon_codes) order by coupon_code for update loop
    if v_coupon.status <> 'issued' then raise exception 'loyalty coupon % is not available', v_coupon.coupon_code; end if;
    v_discount_factor := v_discount_factor * (1 - (v_coupon.discount_pct / 100));
    v_count := v_count + 1;
  end loop;
  if v_count <> array_length(p_coupon_codes, 1) then raise exception 'one or more loyalty coupons do not belong to this customer'; end if;
  v_effective_pct := round((1 - v_discount_factor) * 100, 2);
  v_discount_amount := round(v_discountable * (1 - v_discount_factor), 2);
  v_total := round(v_subtotal - v_discount_amount, 2);
  update public.sales set discount_type = 'loyalty_flat', discount_pct = v_effective_pct, discount_amount = v_discount_amount, total_amount = v_total where id = p_sale_id;
  update public.loyalty_coupons set status = 'redeemed', redeemed_at = now(), redeemed_sale_id = p_sale_id where customer_id = v_customer_id and coupon_code = any(p_coupon_codes) and status = 'issued';
  for v_coupon in select id, discount_pct from public.loyalty_coupons where redeemed_sale_id = p_sale_id and coupon_code = any(p_coupon_codes) loop
    insert into public.loyalty_redemptions(customer_id, sale_id, method, discount_pct, status, created_by, loyalty_coupon_id)
    values (v_customer_id, p_sale_id, 'flat', v_coupon.discount_pct, 'applied', v_staff, v_coupon.id);
  end loop;
  return query select p_sale_id, v_count, v_effective_pct, v_discount_amount, v_total;
end;
$$;

grant execute on function public.redeem_loyalty_coupon_stack(uuid, text[]) to authenticated;

commit;
