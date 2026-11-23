import { NextResponse } from "next/server"
import { roundMoney } from "@/lib/invoices"
import { createAuthenticatedClient } from "@/utils/superbase/server"

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
