begin;

create table if not exists public.regular_lucky_draw_tickets (
  id uuid primary key default gen_random_uuid(),
  draw_date date not null,
  customer_id uuid not null references public.customers(id),
  ticket_number text not null,
  status text not null default 'issued' check (status in ('issued', 'winner', 'voided')),
  winner_note text,
  selected_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (draw_date, customer_id),
  unique (ticket_number)
);

create index if not exists idx_regular_lucky_draw_tickets_date on public.regular_lucky_draw_tickets(draw_date, status);
alter table public.regular_lucky_draw_tickets enable row level security;
drop policy if exists regular_lucky_draw_tickets_staff_select on public.regular_lucky_draw_tickets;
create policy regular_lucky_draw_tickets_staff_select on public.regular_lucky_draw_tickets for select using (public.is_staff());
drop policy if exists regular_lucky_draw_tickets_staff_insert on public.regular_lucky_draw_tickets;
create policy regular_lucky_draw_tickets_staff_insert on public.regular_lucky_draw_tickets for insert with check (public.is_manager());
drop policy if exists regular_lucky_draw_tickets_staff_update on public.regular_lucky_draw_tickets;
create policy regular_lucky_draw_tickets_staff_update on public.regular_lucky_draw_tickets for update using (public.is_manager()) with check (public.is_manager());

create or replace function public.generate_regular_lucky_draw_tickets(p_draw_date date)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_manager() then raise exception 'manager authorization required'; end if;
  if p_draw_date is null then return 0; end if;
  insert into public.regular_lucky_draw_tickets(draw_date, customer_id, ticket_number, created_by)
  select p_draw_date, c.id,
         'RLD-' || to_char(p_draw_date, 'YYYYMMDD') || '-' || lpad((coalesce((select count(*) from public.regular_lucky_draw_tickets t0 where t0.draw_date = p_draw_date), 0) + row_number() over (order by c.full_name, c.id))::text, 4, '0'),
         auth.uid()
  from public.customers c
  where c.is_active = true
    and not exists (select 1 from public.regular_lucky_draw_tickets t where t.draw_date = p_draw_date and t.customer_id = c.id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.generate_regular_lucky_draw_tickets(date) to authenticated;

create or replace function public.mark_regular_lucky_draw_winner(p_ticket_id uuid, p_note text default null)
returns public.regular_lucky_draw_tickets
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket public.regular_lucky_draw_tickets;
begin
  if not public.is_manager() then raise exception 'manager authorization required'; end if;
  update public.regular_lucky_draw_tickets
     set status = 'voided'
   where draw_date = (select draw_date from public.regular_lucky_draw_tickets where id = p_ticket_id)
     and status = 'winner';
  update public.regular_lucky_draw_tickets
     set status = 'winner', winner_note = nullif(trim(p_note), ''), selected_at = now()
   where id = p_ticket_id and status = 'issued'
   returning * into v_ticket;
  if not found then raise exception 'ticket is not available for selection'; end if;
  return v_ticket;
end;
$$;
grant execute on function public.mark_regular_lucky_draw_winner(uuid, text) to authenticated;

commit;
