create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  customer_name text,
  customer_phone text,
  invoice_date date not null default current_date,
  subtotal numeric(14, 2) not null check (subtotal > 0),
  total numeric(14, 2) not null check (total > 0),
  paid_amount numeric(14, 2) not null default 0
    check (paid_amount >= 0 and paid_amount <= total),
  balance numeric(14, 2) generated always as (total - paid_amount) stored,
  payment_method text check (payment_method in ('cash', 'bank')),
  status text generated always as (
    case
      when paid_amount = 0 then 'pending'
      when paid_amount = total then 'paid'
      else 'partial'
    end
  ) stored,
  created_at timestamptz not null default now(),
  constraint invoices_customer_required
    check (nullif(btrim(customer_name), '') is not null or nullif(btrim(customer_phone), '') is not null),
  constraint invoices_payment_method_matches_amount
    check (
      (paid_amount = 0 and payment_method is null)
      or (paid_amount > 0 and payment_method is not null)
    )
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_name text not null check (length(btrim(item_name)) > 0),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index invoices_user_date_idx
  on public.invoices (user_id, invoice_date desc, created_at desc);
create index invoices_customer_phone_idx
  on public.invoices (user_id, customer_phone);
create index invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "Users can read their invoices"
  on public.invoices for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can update their invoices"
  on public.invoices for update to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can read their invoice items"
  on public.invoice_items for select to authenticated
  using (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = (select auth.jwt() ->> 'sub')
    )
  );

revoke all on public.invoices, public.invoice_items from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.invoices to authenticated;
grant update (paid_amount, payment_method) on public.invoices to authenticated;
grant select on public.invoice_items to authenticated;

create or replace function public.create_invoice(
  p_customer_name text,
  p_customer_phone text,
  p_invoice_date date,
  p_paid_amount numeric,
  p_payment_method text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text := auth.jwt() ->> 'sub';
  v_item jsonb;
  v_item_name text;
  v_quantity numeric;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_invoice_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if nullif(btrim(p_customer_name), '') is null
    and nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Customer name or phone number is required';
  end if;
  if length(p_customer_name) > 200 or length(p_customer_phone) > 40 then
    raise exception 'Customer details are too long';
  end if;

  if p_invoice_date is null then
    raise exception 'Invoice date is required';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Invoice items must be an array';
  end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'An invoice must contain between 1 and 100 items';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or v_item ->> 'quantity' is null
      or v_item ->> 'unit_price' is null then
      raise exception 'Invoice item details are invalid';
    end if;

    v_item_name := nullif(btrim(v_item ->> 'item_name'), '');
    if v_item_name is null or length(v_item_name) > 200 then
      raise exception 'Each item must have a name of at most 200 characters';
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unit_price')::numeric;
    if v_quantity <= 0 or v_unit_price < 0
      or v_quantity > 999999999
      or v_unit_price > 999999999999.99
      or v_quantity <> round(v_quantity, 3)
      or v_unit_price <> round(v_unit_price, 2) then
      raise exception 'Item quantity or price has an invalid precision or value';
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Invoice total must be greater than zero';
  end if;
  if v_subtotal > 999999999999.99 then
    raise exception 'Invoice total exceeds the supported amount';
  end if;

  if p_paid_amount is null or p_paid_amount < 0 or p_paid_amount > v_subtotal then
    raise exception 'Paid amount must be between zero and the invoice total';
  end if;

  if (p_paid_amount = 0 and p_payment_method is not null)
    or (p_paid_amount > 0 and (p_payment_method is null or p_payment_method not in ('cash', 'bank'))) then
    raise exception 'A cash or bank method is required for payments';
  end if;

  insert into public.invoices (
    user_id,
    customer_name,
    customer_phone,
    invoice_date,
    subtotal,
    total,
    paid_amount,
    payment_method
  )
  values (
    v_user_id,
    nullif(btrim(p_customer_name), ''),
    nullif(btrim(p_customer_phone), ''),
    p_invoice_date,
    v_subtotal,
    v_subtotal,
    p_paid_amount,
    p_payment_method
  )
  returning id into v_invoice_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_name := btrim(v_item ->> 'item_name');
    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unit_price')::numeric;

    insert into public.invoice_items (invoice_id, item_name, quantity, unit_price, line_total)
    values (
      v_invoice_id,
      v_item_name,
      v_quantity,
      v_unit_price,
      round(v_quantity * v_unit_price, 2)
    );
  end loop;

  return v_invoice_id;
end;
$$;

revoke all on function public.create_invoice(text, text, date, numeric, text, jsonb) from public, anon;
grant execute on function public.create_invoice(text, text, date, numeric, text, jsonb) to authenticated;
