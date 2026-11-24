"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FilePlus2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
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
import { createInvoice, updateInvoiceDetails } from "@/lib/invoice-api"
import {
  formatCurrency,
  getLocalDate,
  roundMoney,
  type Invoice,
  type PaymentMethod,
} from "@/lib/invoices"

type FormValues = {
  customerName: string
  customerPhone: string
  invoiceDate: string
  paidAmount: string
  paymentMethod: PaymentMethod
  items: { itemName: string; quantity: string; unitPrice: string }[]
}

const initialValues: FormValues = {
  customerName: "",
  customerPhone: "",
  invoiceDate: "",
  paidAmount: "0",
  paymentMethod: "cash",
  items: [{ itemName: "", quantity: "1", unitPrice: "" }],
}

export function CreateInvoiceForm({
  invoice,
  inDialog = false,
  onCancel,
  onSaved,
}: {
  invoice?: Invoice
  inDialog?: boolean
  onCancel?: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState("")
  const createMutation = useMutation({ mutationFn: createInvoice })
  const updateMutation = useMutation({ mutationFn: updateInvoiceDetails })
  const form = useForm({
    defaultValues: invoice
      ? {
          customerName: invoice.customer_name ?? "",
          customerPhone: invoice.customer_phone ?? "",
          invoiceDate: invoice.invoice_date,
          paidAmount: invoice.paid_amount.toFixed(2),
          paymentMethod: invoice.payment_method ?? ("cash" as PaymentMethod),
          items: invoice.invoice_items.map((item) => ({
            itemName: item.item_name,
            quantity: String(item.quantity),
            unitPrice: item.unit_price.toFixed(2),
          })),
        }
      : initialValues,
    onSubmit: async ({ value }) => {
      setSubmitError("")

      const customerName = value.customerName.trim()
      const customerPhone = value.customerPhone.trim()
      if (!customerName && !customerPhone) {
        setSubmitError("Add a customer name or phone number to continue.")
        return
      }

      const items = value.items.map((item) => ({
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
      if (
        items.some(
          (item) =>
            !item.itemName ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isFinite(item.unitPrice) ||
            item.unitPrice < 0 ||
            roundMoney(item.quantity * 1000) / 1000 !== item.quantity ||
            roundMoney(item.unitPrice) !== item.unitPrice,
        )
      ) {
        setSubmitError("Check each item name, quantity, and amount.")
        return
      }

      const subtotal = roundMoney(
        items.reduce(
          (sum, item) => sum + roundMoney(item.quantity * item.unitPrice),
          0,
        ),
      )
      const paidAmount = invoice
        ? invoice.paid_amount
        : Number(value.paidAmount)
      if (subtotal <= 0) {
        setSubmitError("The invoice total must be greater than zero.")
        return
      }
      if (
        !Number.isFinite(paidAmount) ||
        paidAmount < 0 ||
        roundMoney(paidAmount) !== paidAmount ||
        paidAmount > subtotal
      ) {
        setSubmitError(
          invoice
            ? "The updated total cannot be less than the amount already paid."
            : "Enter an advance between zero and the invoice total.",
        )
        return
      }
      if (!value.invoiceDate) {
        setSubmitError("Choose an invoice date.")
        return
      }

      try {
        const result = invoice
          ? await updateMutation.mutateAsync({
              id: invoice.id,
              customerName,
              customerPhone,
              invoiceDate: value.invoiceDate,
              items,
            })
          : await createMutation.mutateAsync({
              customerName,
              customerPhone,
              invoiceDate: value.invoiceDate,
              paidAmount,
              paymentMethod: paidAmount > 0 ? value.paymentMethod : null,
              items,
            })
        await queryClient.invalidateQueries({ queryKey: ["invoices"] })
        if (onSaved) {
          onSaved()
        } else {
          router.push(`/invoices/${invoice?.id ?? result.id}`)
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Could not save this invoice.",
        )
      }
    },
  })

  useEffect(() => {
    if (!invoice) form.setFieldValue("invoiceDate", getLocalDate())
  }, [form, invoice])

  return (
    <div className={inDialog ? "text-slate-900" : "min-h-screen bg-slate-50 text-slate-900"}>
      {!inDialog ? <WorkspaceHeader /> : null}
      <main className={inDialog ? "" : "mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10"}>
        <div className={inDialog ? "" : "mx-auto max-w-5xl"}>
          {!inDialog ? <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
            href="/"
          >
            <ArrowLeft className="size-4" />
            Back to {invoice ? "invoice" : "invoices"}
          </Link> : null}

          {!inDialog ? <div className="mb-7 mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {invoice ? "Edit invoice" : "New invoice"}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-slate-950">
              {invoice ? "Edit invoice details" : "Create an invoice"}
            </h1>
            <p className="mt-2 text-[0.95rem] text-slate-500">
              {invoice
                ? "Update the customer, date, or items on this invoice."
                : "Add customer details and items, then record any advance payment."}
            </p>
          </div> : null}

          <form
          className={`grid gap-6 ${inDialog ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader>
                <CardTitle>Customer and date</CardTitle>
                <p className="text-sm text-slate-500">
                  A name or phone number is required.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <form.Field name="customerName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Customer name</FieldLabel>
                      <Input
                        autoComplete="name"
                        id={field.name}
                        maxLength={200}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                        placeholder="e.g. Nimal Perera"
                        value={field.state.value}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="customerPhone">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
                      <Input
                        autoComplete="tel"
                        id={field.name}
                        maxLength={40}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                        placeholder="e.g. 077 123 4567"
                        type="tel"
                        value={field.state.value}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="invoiceDate">
                  {(field) => (
                    <Field className="sm:col-span-2">
                      <FieldLabel htmlFor={field.name}>Invoice date</FieldLabel>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                        type="date"
                        value={field.state.value}
                      />
                    </Field>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Items</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Add each item, its quantity, and unit amount.
                  </p>
                </div>
                <Button
                  className="shrink-0 gap-1.5"
                  disabled={form.getFieldValue("items").length >= 100}
                  onClick={() =>
                    form.setFieldValue("items", (items) => [
                      ...items,
                      { itemName: "", quantity: "1", unitPrice: "" },
                    ])
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <form.Subscribe selector={(state) => state.values.items}>
                    {(items) =>
                      items.map((item, index) => (
                        <div
                          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_120px_160px_40px]"
                          key={index}
                        >
                          <form.Field
                            name={`items[${index}].itemName` as const}
                          >
                            {(field) => (
                              <Field>
                                <FieldLabel htmlFor={field.name}>
                                  Item name
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  maxLength={200}
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    field.handleChange(event.currentTarget.value)
                                  }
                                  placeholder="e.g. Website design"
                                  value={field.state.value}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <form.Field
                            name={`items[${index}].quantity` as const}
                          >
                            {(field) => (
                              <Field>
                                <FieldLabel htmlFor={field.name}>
                                  Quantity
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  min="0.001"
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    field.handleChange(event.currentTarget.value)
                                  }
                                  step="0.001"
                                  type="number"
                                  value={field.state.value}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <form.Field
                            name={`items[${index}].unitPrice` as const}
                          >
                            {(field) => (
                              <Field>
                                <FieldLabel htmlFor={field.name}>
                                  Unit amount (LKR)
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  min="0"
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    field.handleChange(event.currentTarget.value)
                                  }
                                  placeholder="0.00"
                                  step="0.01"
                                  type="number"
                                  value={field.state.value}
                                />
                              </Field>
                            )}
                          </form.Field>
                          <div className="flex items-end justify-end">
                            <Button
                              aria-label={`Remove item ${index + 1}`}
                              className="text-slate-400 hover:text-rose-600"
                              disabled={items.length === 1}
                              onClick={() =>
                                form.setFieldValue("items", (currentItems) =>
                                  currentItems.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="text-right text-xs font-medium text-slate-500 sm:col-span-4">
                            Line total:{" "}
                            {formatCurrency(
                              roundMoney(
                                (Number(item.quantity) || 0) *
                                  (Number(item.unitPrice) || 0),
                              ),
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </form.Subscribe>
                </div>
              </CardContent>
            </Card>

            {!invoice ? (
            <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
              <CardHeader>
                <CardTitle>Advance payment</CardTitle>
                <p className="text-sm text-slate-500">
                  Leave the advance at zero to keep this invoice pending.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <form.Field name="paidAmount">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Amount received (LKR)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        min="0"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                        placeholder="0.00"
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
                        <SelectTrigger aria-label="Payment method" id={field.name}>
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
              </CardContent>
            </Card>
            ) : null}
          </div>

          <aside className="space-y-4">
            <Card className={`border-0 shadow-sm ring-1 ring-slate-200/80 ${inDialog ? "" : "lg:sticky lg:top-8"}`}>
              <CardHeader>
                <CardTitle>Invoice summary</CardTitle>
              </CardHeader>
              <CardContent>
                <form.Subscribe selector={(state) => state.values}>
                  {(values) => {
                    const subtotal = roundMoney(
                      values.items.reduce(
                        (sum, item) =>
                          sum +
                          roundMoney(
                            (Number(item.quantity) || 0) *
                              (Number(item.unitPrice) || 0),
                          ),
                        0,
                      ),
                    )
                    const paidAmount = Number(values.paidAmount) || 0

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-slate-900">
                          <span>Invoice total</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>{invoice ? "Paid so far" : "Advance received"}</span>
                          <span>{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex justify-between text-sm font-medium text-slate-900">
                            <span>Balance due</span>
                            <span>
                              {formatCurrency(Math.max(subtotal - paidAmount, 0))}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs leading-5 text-slate-500">
                        {invoice
                          ? "The existing payment is retained when you edit this invoice."
                          : "The invoice starts as pending, partial, or paid based on the advance amount."}
                        </p>
                      </div>
                    )
                  }}
                </form.Subscribe>

                {submitError ? (
                  <p
                    className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                    role="alert"
                  >
                    {submitError}
                  </p>
                ) : null}

                <Button
                  className="mt-6 h-10 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  type="submit"
                >
                  <FilePlus2 className="size-4" />
                  {createMutation.isLoading || updateMutation.isLoading
                    ? "Saving invoice..."
                    : invoice
                      ? "Save changes"
                      : "Create invoice"}
                </Button>
                <Button
                  className="mt-2 w-full"
                  onClick={() =>
                    onCancel
                      ? onCancel()
                      : router.push(invoice ? `/invoices/${invoice.id}` : "/")
                  }
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </aside>
          </form>
        </div>
      </main>
    </div>
  )
}
