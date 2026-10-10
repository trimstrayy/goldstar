begin;

create or replace function public.generate_regular_lucky_draw_tickets(p_draw_date date)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_manager() then raise exception 'manager authorization required'; end if;
  if p_draw_date is null then return 0; end if;

  with eligible_customers as (
    select s.customer_id, min(s.sale_date) as first_purchase_at
    from public.sales s
    where s.customer_id is not null
      and s.status = 'completed'
      and (s.sale_date at time zone 'Asia/Kathmandu')::date = p_draw_date
    group by s.customer_id
  ), missing_customers as (
    select e.customer_id,
           row_number() over (order by e.first_purchase_at, e.customer_id) as first_come_number
    from eligible_customers e
    where not exists (
      select 1 from public.regular_lucky_draw_tickets existing
      where existing.draw_date = p_draw_date and existing.customer_id = e.customer_id
    )
  )
  insert into public.regular_lucky_draw_tickets(draw_date, customer_id, ticket_number, created_by)
  select p_draw_date,
         m.customer_id,
         'GSB-RLD-' || to_char(p_draw_date, 'YYYYMMDD') || '-' ||
           lpad((coalesce((select count(*) from public.regular_lucky_draw_tickets t0 where t0.draw_date = p_draw_date), 0) + m.first_come_number)::text, 2, '0'),
         auth.uid()
  from missing_customers m;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.generate_regular_lucky_draw_tickets(date) to authenticated;

commit;
