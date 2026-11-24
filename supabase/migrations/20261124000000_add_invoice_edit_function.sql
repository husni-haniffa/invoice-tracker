create or replace function public.update_invoice(
  p_invoice_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_invoice_date date,
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
  v_paid_amount numeric;
  v_total numeric;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select paid_amount, total
    into v_paid_amount, v_total
    from public.invoices
    where id = p_invoice_id and user_id = v_user_id
    for update;
  if not found then
    raise exception 'Invoice not found' using errcode = 'P0002';
  end if;
  if v_paid_amount >= v_total then
    raise exception 'Paid invoices cannot be edited' using errcode = '22023';
  end if;
  if nullif(btrim(p_customer_name), '') is null
    and nullif(btrim(p_customer_phone), '') is null then
    raise exception 'Customer name or phone number is required' using errcode = '22023';
  end if;
  if length(p_customer_name) > 200 or length(p_customer_phone) > 40 then
    raise exception 'Customer details are too long' using errcode = '22023';
  end if;
  if p_invoice_date is null then
    raise exception 'Invoice date is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Invoice items must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'An invoice must contain between 1 and 100 items' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or v_item ->> 'quantity' is null
      or v_item ->> 'unit_price' is null then
      raise exception 'Invoice item details are invalid' using errcode = '22023';
    end if;

    v_item_name := nullif(btrim(v_item ->> 'item_name'), '');
    if v_item_name is null or length(v_item_name) > 200 then
      raise exception 'Each item must have a name of at most 200 characters' using errcode = '22023';
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unit_price')::numeric;
    if v_quantity <= 0 or v_unit_price < 0
      or v_quantity > 999999999
      or v_unit_price > 999999999999.99
      or v_quantity <> round(v_quantity, 3)
      or v_unit_price <> round(v_unit_price, 2) then
      raise exception 'Item quantity or price has an invalid precision or value' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
  end loop;

  if v_subtotal <= 0 or v_subtotal > 999999999999.99 then
    raise exception 'Invoice total is outside the supported range' using errcode = '22023';
  end if;
  if v_subtotal < v_paid_amount then
    raise exception 'The updated total cannot be less than the amount already paid'
      using errcode = '22023';
  end if;

  update public.invoices
    set customer_name = nullif(btrim(p_customer_name), ''),
        customer_phone = nullif(btrim(p_customer_phone), ''),
        invoice_date = p_invoice_date,
        subtotal = v_subtotal,
        total = v_subtotal
    where id = p_invoice_id;

  delete from public.invoice_items where invoice_id = p_invoice_id;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_name := btrim(v_item ->> 'item_name');
    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unit_price')::numeric;

    insert into public.invoice_items (
      invoice_id,
      item_name,
      quantity,
      unit_price,
      line_total
    )
    values (
      p_invoice_id,
      v_item_name,
      v_quantity,
      v_unit_price,
      round(v_quantity * v_unit_price, 2)
    );
  end loop;

  return p_invoice_id;
end;
$$;

revoke all on function public.update_invoice(uuid, text, text, date, jsonb) from public, anon;
grant execute on function public.update_invoice(uuid, text, text, date, jsonb) to authenticated;
