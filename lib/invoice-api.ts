import type { Invoice, PaymentMethod } from "@/lib/invoices"

async function getErrorMessage(response: Response) {
  const result: unknown = await response.json().catch(() => null)
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error
  }
  return "Something went wrong. Please try again."
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch("/api/invoices", { cache: "no-store" })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<Invoice[]>
}

export async function createInvoice(input: {
  customerName: string
  customerPhone: string
  invoiceDate: string
  paidAmount: number
  paymentMethod: PaymentMethod | null
  items: { itemName: string; quantity: number; unitPrice: number }[]
}) {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<{ id: string }>
}

export async function updateInvoicePayment(input: {
  id: string
  paidAmount: number
  paymentMethod: PaymentMethod | null
}) {
  const response = await fetch(`/api/invoices/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paidAmount: input.paidAmount,
      paymentMethod: input.paymentMethod,
    }),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<{
    id: string
    paid_amount: number
    balance: number
    status: Invoice["status"]
    payment_method: PaymentMethod | null
  }>
}

export async function updateInvoiceDetails(input: {
  id: string
  customerName: string
  customerPhone: string
  invoiceDate: string
  items: { itemName: string; quantity: number; unitPrice: number }[]
}) {
  const response = await fetch(`/api/invoices/${input.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      invoiceDate: input.invoiceDate,
      items: input.items,
    }),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<{ id: string }>
}
