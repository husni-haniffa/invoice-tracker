"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Banknote,
  Building2,
  CircleAlert,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { WorkspaceHeader } from "@/components/workspace-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchInvoices, updateInvoicePayment } from "@/lib/invoice-api"
import {
  formatCurrency,
  formatInvoiceDate,
  roundMoney,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/invoices"

const statusClassNames: Record<InvoiceStatus, string> = {
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

export function InvoiceDetails({ invoiceId }: { invoiceId: string }) {
  const { data: invoices = [], error, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  })
  const invoice = invoices.find((item) => item.id === invoiceId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <WorkspaceHeader />
        <div className="mx-auto h-72 max-w-5xl animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <WorkspaceHeader />
        <div className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              {error instanceof Error ? error.message : "Invoice not found."}
            </p>
          </div>
          <Link className="mt-4 inline-flex font-medium underline" href="/">
            Return to invoices
          </Link>
        </div>
      </div>
    )
  }

  return <InvoiceRecord key={invoice.id} invoice={invoice} />
}

function InvoiceRecord({ invoice }: { invoice: Invoice }) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState("")
  const updateMutation = useMutation({ mutationFn: updateInvoicePayment })
  const form = useForm({
    defaultValues: {
      paidAmount: invoice.paid_amount.toFixed(2),
      paymentMethod: invoice.payment_method ?? ("cash" as PaymentMethod),
    },
    onSubmit: async ({ value }) => {
      setFormError("")
      const paidAmount = Number(value.paidAmount)
      if (
        !Number.isFinite(paidAmount) ||
        paidAmount < 0 ||
        roundMoney(paidAmount) !== paidAmount ||
        paidAmount > invoice.total
      ) {
        setFormError("Enter an amount between zero and the invoice total.")
        return
      }

      try {
        const updated = await updateMutation.mutateAsync({
          id: invoice.id,
          paidAmount,
          paymentMethod: paidAmount > 0 ? value.paymentMethod : null,
        })
        queryClient.setQueryData<Invoice[]>(["invoices"], (current) =>
          current?.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item,
          ),
        )
        await queryClient.invalidateQueries({ queryKey: ["invoices"] })
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Could not save this payment.",
        )
      }
    },
  })

  const methodIcon =
    invoice.payment_method === "bank" ? (
      <Building2 className="size-4" />
    ) : invoice.payment_method === "cash" ? (
      <Banknote className="size-4" />
    ) : null

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <WorkspaceHeader />
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          href="/"
        >
          <ArrowLeft className="size-4" />
          Back to invoices
        </Link>

        <div className="mt-7 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
              Invoice details
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-slate-950">
              {invoice.customer_name || invoice.customer_phone}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {invoice.customer_name && invoice.customer_phone
                ? invoice.customer_phone
                : `Invoice #${invoice.id.slice(0, 8).toUpperCase()}`}
            </p>
          </div>
          <Badge
            className={`mt-1 px-3 py-1 capitalize ${statusClassNames[invoice.status]}`}
            variant="outline"
          >
            {invoice.status}
          </Badge>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Invoice items</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Dated {formatInvoiceDate(invoice.invoice_date)}
                  </p>
                </div>
                <FileText className="size-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="border-b border-slate-100 pb-3 font-medium">
                          Item
                        </th>
                        <th className="border-b border-slate-100 pb-3 text-right font-medium">
                          Qty
                        </th>
                        <th className="border-b border-slate-100 pb-3 text-right font-medium">
                          Unit amount
                        </th>
                        <th className="border-b border-slate-100 pb-3 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.invoice_items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-4 font-medium text-slate-900">
                            {item.item_name}
                          </td>
                          <td className="py-4 text-right text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-4 text-right text-slate-600">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-4 text-right font-medium text-slate-900">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ml-auto mt-5 max-w-xs space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-950">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader>
                <CardTitle>Payment status</CardTitle>
                <p className="text-sm text-slate-500">
                  Update the total received to manage pending or partial payments.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-5 sm:grid-cols-2"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    void form.handleSubmit()
                  }}
                >
                  <form.Field name="paidAmount">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Total paid so far (LKR)
                        </FieldLabel>
                        <Input
                          id={field.name}
                          min="0"
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.currentTarget.value)
                          }
                          step="0.01"
                          type="number"
                          value={field.state.value}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="paymentMethod">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Payment method
                        </FieldLabel>
                        <Select
                          onValueChange={(value) => {
                            if (value === "cash" || value === "bank") {
                              field.handleChange(value)
                            }
                          }}
                          value={field.state.value}
                        >
                          <SelectTrigger
                            aria-label="Payment method"
                            id={field.name}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank">Bank transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>

                  <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Invoice total</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-slate-500">Remaining balance</span>
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(invoice.balance)}
                      </span>
                    </div>
                    {invoice.payment_method ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        {methodIcon}
                        {invoice.payment_method === "bank"
                          ? "Bank transfer"
                          : "Cash"}
                      </div>
                    ) : null}
                  </div>

                  {formError ? (
                    <p
                      className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2"
                      role="alert"
                    >
                      {formError}
                    </p>
                  ) : null}

                  <div className="sm:col-span-2">
                    <Button
                      className="h-10 bg-violet-600 px-5 text-white hover:bg-violet-700"
                      disabled={updateMutation.isLoading}
                      type="submit"
                    >
                      {updateMutation.isLoading
                        ? "Saving payment..."
                        : "Save payment status"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <aside>
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader>
                <CardTitle>Balance summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Paid</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950">
                    {formatCurrency(invoice.paid_amount)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">Balance due</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-950">
                    {formatCurrency(invoice.balance)}
                  </p>
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Payment method is recorded with the total paid amount. The
                  status is calculated automatically from the remaining balance.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
        </div>
      </main>
    </div>
  )
}
