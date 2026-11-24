import { NextResponse } from "next/server"
import { roundMoney } from "@/lib/invoices"
import { createAuthenticatedClient } from "@/utils/superbase/server"

type JsonRecord = Record<string, unknown>

type ParsedItem = {
  item_name: string
  quantity: number
  unit_price: number
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  if (value < 0 || value > 999999999999) return null
  if (roundMoney(value) !== value) return null
  return value
}

function parseInvoice(value: unknown) {
  if (!isRecord(value)) return { error: "Invoice details are required." }

  const customerName =
    typeof value.customerName === "string" ? value.customerName.trim() : ""
  const customerPhone =
    typeof value.customerPhone === "string" ? value.customerPhone.trim() : ""

  if (!customerName && !customerPhone) {
    return { error: "Enter a customer name or phone number." }
  }
  if (customerName.length > 200 || customerPhone.length > 40) {
    return { error: "Customer details are too long." }
  }

  const invoiceDate = value.invoiceDate
  const parsedDate =
    typeof invoiceDate === "string"
      ? new Date(`${invoiceDate}T00:00:00.000Z`)
      : null
  if (
    typeof invoiceDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) ||
    !parsedDate ||
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== invoiceDate
  ) {
    return { error: "Choose a valid invoice date." }
  }

  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100) {
    return { error: "Add between 1 and 100 invoice items." }
  }

  const items: ParsedItem[] = []
  for (const item of value.items) {
    if (!isRecord(item)) return { error: "Invoice item details are invalid." }

    const itemName =
      typeof item.itemName === "string" ? item.itemName.trim() : ""
    const quantity = item.quantity
    const unitPrice = parseAmount(item.unitPrice)

    if (!itemName || itemName.length > 200) {
      return { error: "Each item needs a name of at most 200 characters." }
    }
    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 999999999 ||
      roundMoney(quantity * 1000) / 1000 !== quantity
    ) {
      return { error: "Each item quantity must be positive with up to 3 decimals." }
    }
    if (unitPrice === null) {
      return { error: "Each item price must be a non-negative amount with up to 2 decimals." }
    }

    items.push({ item_name: itemName, quantity, unit_price: unitPrice })
  }

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + roundMoney(item.quantity * item.unit_price), 0),
  )
  if (subtotal <= 0 || subtotal > 999999999999.99) {
    return { error: "Invoice total must be between zero and LKR 999,999,999,999.99." }
  }

  const paidAmount = parseAmount(value.paidAmount)
  if (paidAmount === null || paidAmount > subtotal) {
    return { error: "Paid amount must be between zero and the invoice total." }
  }

  const paymentMethod =
    paidAmount === 0
      ? null
      : value.paymentMethod === "cash" || value.paymentMethod === "bank"
        ? value.paymentMethod
        : null
  if (paidAmount > 0 && paymentMethod === null) {
    return { error: "Choose cash or bank for the recorded payment." }
  }

  return {
    data: {
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      invoiceDate,
      paidAmount,
      paymentMethod,
      items,
    },
  }
}

export async function GET() {
  const session = await createAuthenticatedClient()
  if (!session) {
    return NextResponse.json({ error: "Sign in to view invoices." }, { status: 401 })
  }

  const { data, error } = await session.supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load invoices:", error.code, error.message)
    const message =
      error.code === "42P01" ||
      error.code === "PGRST200" ||
      error.code === "PGRST205"
        ? "Invoice tables are missing. Apply the Supabase invoice migration, then refresh."
        : error.code === "PGRST301" || error.code === "42501"
          ? "Supabase rejected the Clerk session. Connect Clerk under Supabase Authentication → Third-Party Auth."
          : "Could not load invoices. Check the Supabase error in the server terminal."
    return NextResponse.json(
      { error: message },
      { status: 503 },
    )
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await createAuthenticatedClient()
  if (!session) {
    return NextResponse.json({ error: "Sign in to create an invoice." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = parseInvoice(body)
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await session.supabase.rpc("create_invoice", {
    p_customer_name: parsed.data.customerName,
    p_customer_phone: parsed.data.customerPhone,
    p_invoice_date: parsed.data.invoiceDate,
    p_paid_amount: parsed.data.paidAmount,
    p_payment_method: parsed.data.paymentMethod,
    p_items: parsed.data.items,
  })

  if (error) {
    console.error("Failed to create invoice:", error.code, error.message)
    const message =
      error.code === "PGRST202"
        ? "Invoice database function is missing. Apply the Supabase invoice migration."
        : error.code === "PGRST301"
          ? "Supabase rejected the Clerk session. Connect this Clerk instance under Supabase Authentication → Third-Party Auth."
          : error.code === "42501"
            ? "Clerk is connected, but the database denied this operation. Check the invoice migration policies."
            : "Could not save this invoice. Check the Supabase error in the server terminal."
    return NextResponse.json(
      { error: message },
      { status: error.code === "PGRST301" ? 401 : 503 },
    )
  }

  return NextResponse.json({ id: data }, { status: 201 })
}
