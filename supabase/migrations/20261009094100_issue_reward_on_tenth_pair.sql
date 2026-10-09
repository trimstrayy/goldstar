begin;

create or replace function public.redeem_loyalty_coupon_stack(p_sale_id uuid, p_coupon_codes text[])
returns table(out_sale_id uuid, out_coupon_count integer, out_effective_discount_pct numeric, out_discount_amount numeric, out_total_amount numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_subtotal numeric;
  v_discountable numeric;
  v_discount_pct numeric := 0;
  v_coupon record;
  v_count integer := 0;
  v_effective_pct numeric;
  v_discount_amount numeric;
  v_total numeric;
  v_staff uuid := auth.uid();
  v_cycle_size integer;
  v_progress integer;
  v_completed_cycles integer;
  v_qualifying_pairs integer;
  v_new_cycles integer;
  v_cycle integer;
  v_code text;
begin
  if not public.is_staff() then raise exception 'staff authorization required'; end if;
  if coalesce(array_length(p_coupon_codes, 1), 0) = 0 then raise exception 'at least one loyalty coupon is required'; end if;

  select customer_id into v_customer_id from public.sales
    where id = p_sale_id and status = 'completed' for update;
  if not found or v_customer_id is null then raise exception 'completed customer sale not found'; end if;

  select coalesce(sum(quantity * unit_price), 0),
         coalesce(sum(case when discount_eligible then quantity * unit_price else 0 end), 0),
         coalesce(sum(case when counts_for_loyalty then quantity else 0 end), 0)::integer
    into v_subtotal, v_discountable, v_qualifying_pairs
    from public.sale_items where sale_id = p_sale_id;
  if v_discountable <= 0 then raise exception 'sale has no discount-eligible items'; end if;

  -- The app sends this marker only when the current sale contains the
  -- qualifying 10th pair. Create the cycle coupon inside this transaction,
  -- then redeem it immediately so the 10th pair receives the discount.
  if p_coupon_codes[1] = '__AUTO_CYCLE_REWARD__' then
    select cycle_size, progress_in_cycle, completed_cycles
      into v_cycle_size, v_progress, v_completed_cycles
      from public.customer_loyalty_status where customer_id = v_customer_id;
    if v_cycle_size is null or v_cycle_size <= 0 then raise exception 'customer loyalty cycle is not configured'; end if;
    v_new_cycles := floor((v_progress + v_qualifying_pairs)::numeric / v_cycle_size)::integer;
    if v_new_cycles <= v_completed_cycles then raise exception 'the current sale does not complete a loyalty cycle'; end if;

    for v_cycle in (v_completed_cycles + 1)..v_new_cycles loop
      v_code := 'LY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into public.loyalty_coupons(customer_id, cycle_number, coupon_code, discount_pct, created_by)
      values (v_customer_id, v_cycle, v_code, 15, v_staff)
      on conflict (customer_id, cycle_number) do nothing;
    end loop;

    select array_agg(coupon_code order by cycle_number)
      into p_coupon_codes
      from public.loyalty_coupons
      where customer_id = v_customer_id
        and cycle_number > v_completed_cycles
        and cycle_number <= v_new_cycles
        and status = 'issued';
  end if;

  for v_coupon in select * from public.loyalty_coupons
    where customer_id = v_customer_id and coupon_code = any(p_coupon_codes)
    order by coupon_code for update loop
    if v_coupon.status <> 'issued' then raise exception 'loyalty coupon % is not available', v_coupon.coupon_code; end if;
    v_discount_pct := v_discount_pct + v_coupon.discount_pct;
    v_count := v_count + 1;
  end loop;
  if v_count <> array_length(p_coupon_codes, 1) then raise exception 'one or more loyalty coupons do not belong to this customer'; end if;

  v_effective_pct := least(100, round(v_discount_pct, 2));
  v_discount_amount := round(v_discountable * (v_effective_pct / 100), 2);
  v_total := round(v_subtotal - v_discount_amount, 2);
  update public.sales set discount_type = 'loyalty_flat', discount_pct = v_effective_pct,
    discount_amount = v_discount_amount, total_amount = v_total where id = p_sale_id;
  update public.loyalty_coupons set status = 'redeemed', redeemed_at = now(), redeemed_sale_id = p_sale_id
    where customer_id = v_customer_id and coupon_code = any(p_coupon_codes) and status = 'issued';
  for v_coupon in select id, discount_pct from public.loyalty_coupons
    where redeemed_sale_id = p_sale_id and coupon_code = any(p_coupon_codes) loop
    insert into public.loyalty_redemptions(customer_id, sale_id, method, discount_pct, status, created_by, loyalty_coupon_id)
      values (v_customer_id, p_sale_id, 'flat', v_coupon.discount_pct, 'applied', v_staff, v_coupon.id);
  end loop;
  return query select p_sale_id, v_count, v_effective_pct, v_discount_amount, v_total;
end;
$$;

grant execute on function public.redeem_loyalty_coupon_stack(uuid, text[]) to authenticated;
commit;
