export type PaymentMethod = "cash" | "bank"
export type InvoiceStatus = "pending" | "partial" | "paid"

export type InvoiceLineInput = {
  itemName: string
  quantity: number
  unitPrice: number
}

export type InvoiceLine = {
  id: string
  invoice_id: string
  item_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export type Invoice = {
  id: string
  customer_name: string | null
  customer_phone: string | null
  invoice_date: string
  subtotal: number
  total: number
  paid_amount: number
  balance: number
  payment_method: PaymentMethod | null
  status: InvoiceStatus
  created_at: string
  invoice_items: InvoiceLine[]
}

export function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatInvoiceDate(date: string) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

export function getLocalDate() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}
