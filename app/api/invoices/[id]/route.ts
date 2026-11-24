import { NextResponse } from "next/server"
import { roundMoney } from "@/lib/invoices"
import { createAuthenticatedClient } from "@/utils/superbase/server"

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await createAuthenticatedClient()
  if (!session) {
    return NextResponse.json({ error: "Sign in to edit an invoice." }, { status: 401 })
  }

  const { id } = await params
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invoice details are required." }, { status: 400 })
  }

  const customerName =
    typeof body.customerName === "string" ? body.customerName.trim() : ""
  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone.trim() : ""
  if ((!customerName && !customerPhone) || customerName.length > 200 || customerPhone.length > 40) {
    return NextResponse.json(
      { error: "Enter a customer name or phone number." },
      { status: 400 },
    )
  }

  const invoiceDate = body.invoiceDate
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
    return NextResponse.json({ error: "Choose a valid invoice date." }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) {
    return NextResponse.json(
      { error: "Add between 1 and 100 invoice items." },
      { status: 400 },
    )
  }

  const items: { item_name: string; quantity: number; unit_price: number }[] = []
  for (const item of body.items) {
    if (!isRecord(item)) {
      return NextResponse.json({ error: "Invoice item details are invalid." }, { status: 400 })
    }

    const itemName =
      typeof item.itemName === "string" ? item.itemName.trim() : ""
    const quantity = item.quantity
    const unitPrice = item.unitPrice
    if (!itemName || itemName.length > 200) {
      return NextResponse.json({ error: "Each item needs a valid name." }, { status: 400 })
    }
    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 999999999 ||
      roundMoney(quantity * 1000) / 1000 !== quantity
    ) {
      return NextResponse.json({ error: "Each item needs a valid quantity." }, { status: 400 })
    }
    if (
      typeof unitPrice !== "number" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 999999999999.99 ||
      roundMoney(unitPrice) !== unitPrice
    ) {
      return NextResponse.json({ error: "Each item needs a valid unit amount." }, { status: 400 })
    }

    items.push({ item_name: itemName, quantity, unit_price: unitPrice })
  }

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + roundMoney(item.quantity * item.unit_price), 0),
  )
  if (subtotal <= 0 || subtotal > 999999999999.99) {
    return NextResponse.json({ error: "Invoice total must be greater than zero." }, { status: 400 })
  }

  const { data: currentInvoice, error: readError } = await session.supabase
    .from("invoices")
    .select("paid_amount, total, status")
    .eq("id", id)
    .maybeSingle()
  if (readError) {
    console.error("Failed to read invoice before editing:", readError.message)
    return NextResponse.json(
      { error: "Could not edit this invoice. Check your Supabase setup." },
      { status: 503 },
    )
  }
  if (!currentInvoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
  }
  if (currentInvoice.status === "paid") {
    return NextResponse.json({ error: "Paid invoices cannot be edited." }, { status: 400 })
  }
  if (subtotal < currentInvoice.paid_amount) {
    return NextResponse.json(
      { error: "The updated total cannot be less than the amount already paid." },
      { status: 400 },
    )
  }

  const { data, error } = await session.supabase.rpc("update_invoice", {
    p_invoice_id: id,
    p_customer_name: customerName || null,
    p_customer_phone: customerPhone || null,
    p_invoice_date: invoiceDate,
    p_items: items,
  })
  if (error) {
    console.error("Failed to update invoice details:", error.code, error.message)
    if (error.code === "22023") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
    }
    return NextResponse.json(
      {
        error:
          error.code === "PGRST202"
            ? "Invoice edit function is missing. Apply the latest Supabase migration."
            : "Could not save invoice changes. Check the Supabase error in the server terminal.",
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ id: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await createAuthenticatedClient()
  if (!session) {
    return NextResponse.json({ error: "Sign in to update an invoice." }, { status: 401 })
  }

  const { id } = await params
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Payment details are required." }, { status: 400 })
  }

  const paidAmount = body.paidAmount
  const paymentMethod =
    paidAmount === 0
      ? null
      : body.paymentMethod === "cash" || body.paymentMethod === "bank"
        ? body.paymentMethod
        : null

  if (
    typeof paidAmount !== "number" ||
    !Number.isFinite(paidAmount) ||
    paidAmount < 0 ||
    roundMoney(paidAmount) !== paidAmount ||
    (paidAmount > 0 && paymentMethod === null)
  ) {
    return NextResponse.json(
      { error: "Enter a valid paid amount and choose cash or bank." },
      { status: 400 },
    )
  }

  const { data: currentInvoice, error: readError } = await session.supabase
    .from("invoices")
    .select("total")
    .eq("id", id)
    .maybeSingle()

  if (readError) {
    console.error("Failed to read invoice before payment update:", readError.message)
    return NextResponse.json(
      { error: "Could not update this invoice. Check your Supabase setup." },
      { status: 503 },
    )
  }
  if (!currentInvoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
  }
  if (paidAmount > currentInvoice.total) {
    return NextResponse.json(
      { error: "Paid amount cannot exceed the invoice total." },
      { status: 400 },
    )
  }

  const { data, error } = await session.supabase
    .from("invoices")
    .update({ paid_amount: paidAmount, payment_method: paymentMethod })
    .eq("id", id)
    .select("id, paid_amount, balance, status, payment_method")
    .maybeSingle()

  if (error) {
    console.error("Failed to update invoice payment:", error.message)
    return NextResponse.json(
      { error: "Could not save this payment. Try again." },
      { status: 503 },
    )
  }
  if (!data) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
  }

  return NextResponse.json(data)
}
