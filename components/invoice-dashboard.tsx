"use client"

import { UserButton } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CircleAlert,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Pencil,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InvoiceFormDialog } from "@/components/invoice-form-dialog"
import { fetchInvoices } from "@/lib/invoice-api"
import {
  formatCurrency,
  formatInvoiceDate,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/invoices"

const filters: { label: string; value: "all" | InvoiceStatus }[] = [
  { label: "All invoices", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
]

function getCustomerName(invoice: Invoice) {
  return invoice.customer_name || "Customer"
}

function statusStyle(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function getCustomerInitials(invoice: Invoice) {
  const label = invoice.customer_name || invoice.customer_phone || "Customer"
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function MetricCard({
  label,
  amount,
  note,
  icon,
  accent,
}: {
  label: string
  amount: string
  note: string
  icon: ReactNode
  accent: "blue" | "green" | "amber"
}) {
  const accentStyles = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      border: "border-l-blue-500",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700",
      border: "border-l-emerald-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      border: "border-l-amber-500",
    },
  }

  return (
    <Card
      className={`overflow-hidden rounded-2xl border-0 border-l-[3px] shadow-[0_8px_28px_rgba(27,31,55,0.045)] ring-1 ring-slate-200/80 ${accentStyles[accent].border}`}
    >
      <CardContent className="flex min-h-[148px] items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-4 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            {amount}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent].icon}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="h-14 animate-pulse rounded-lg bg-slate-100" key={index} />
      ))}
    </div>
  )
}

export function InvoiceDashboard() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all")
  const [dialogInvoice, setDialogInvoice] = useState<Invoice | null | "new">(null)
  const { data: invoices = [], error, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  })

  const searchedInvoices = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return invoices
    return invoices.filter((invoice) =>
      [invoice.customer_name, invoice.customer_phone]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(term)),
    )
  }, [invoices, search])

  const visibleInvoices = useMemo(
    () =>
      statusFilter === "all"
        ? searchedInvoices
        : searchedInvoices.filter((invoice) => invoice.status === statusFilter),
    [searchedInvoices, statusFilter],
  )

  const totalBilled = searchedInvoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  )
  const totalPaid = searchedInvoices.reduce(
    (sum, invoice) => sum + invoice.paid_amount,
    0,
  )
  const totalPending = searchedInvoices.reduce(
    (sum, invoice) => sum + invoice.balance,
    0,
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[240px] shrink-0 bg-slate-800 px-5 py-7 text-white lg:flex lg:flex-col">
          <Link className="flex items-center gap-3 px-2" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="size-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-white">Invoice Tracker</span>
              <span className="block text-xs text-slate-400">Billing workspace</span>
            </span>
          </Link>

          <p className="mb-3 mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
          <div className="space-y-1.5">
            <Link
              className="flex items-center gap-3 rounded-xl bg-white/[0.09] px-3 py-3 text-sm font-medium text-white ring-1 ring-white/[0.06]"
              href="/"
            >
              <LayoutDashboard className="size-4 text-sky-300" />
              Overview
            </Link>
            <Link
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              href="/#invoices"
            >
              <FileText className="size-4" />
              Invoice list
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-4 py-3.5 backdrop-blur-xl sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <Link className="flex items-center gap-2 lg:hidden" href="/">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <FileText className="size-4" />
                </span>
                <span className="font-semibold">Invoice Tracker</span>
              </Link>
              <div className="relative hidden w-full max-w-sm sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  aria-label="Search customers by name or phone"
                  className="h-10 border-slate-200 bg-slate-50 pl-9"
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Search name or phone..."
                  value={search}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  className="h-10 gap-2 rounded-xl bg-blue-600 px-4 text-white shadow-sm transition hover:bg-blue-700"
                  onClick={() => setDialogInvoice("new")}
                >
                  <FilePlus2 className="size-4" />
                  <span className="hidden sm:inline">Create invoice</span>
                  <span className="sm:hidden">New</span>
                </Button>
                <UserButton />
              </div>
            </div>
            <div className="relative mt-3 sm:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Search customers by name or phone"
                className="h-10 border-slate-200 bg-slate-50 pl-9"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search name or phone..."
                value={search}
              />
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Your business at a glance
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-slate-950">
                  Overview
                </h1>
                <p className="mt-2 text-[0.95rem] text-slate-500">
                  Track invoices, payments, and customer balances.
                </p>
              </div>
              <p className="text-sm text-slate-500">
                {searchedInvoices.length}{" "}
                {searchedInvoices.length === 1 ? "invoice" : "invoices"}
                {search.trim() ? " match your search" : " in total"}
              </p>
            </div>

            {error ? (
              <div
                className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                role="alert"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  {error instanceof Error
                    ? error.message
                    : "Could not load invoices. Please try again."}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                accent="blue"
                amount={formatCurrency(totalBilled)}
                icon={<FileText className="size-5" />}
                label="Total invoiced"
                note="Across matching customers"
              />
              <MetricCard
                accent="green"
                amount={formatCurrency(totalPaid)}
                icon={<ArrowUpRight className="size-5" />}
                label="Paid amount"
                note="Payments received"
              />
              <MetricCard
                accent="amber"
                amount={formatCurrency(totalPending)}
                icon={<ArrowDownRight className="size-5" />}
                label="Pending amount"
                note="Outstanding, including partial invoices"
              />
            </div>

            <Card
              className="mt-8 overflow-hidden rounded-2xl border-0 shadow-[0_8px_32px_rgba(27,31,55,0.045)] ring-1 ring-slate-200/80"
              id="invoices"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">Invoices</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review balances and update payment status.
                  </p>
                </div>
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
                  {filters.map((filter) => (
                    <button
                      aria-pressed={statusFilter === filter.value}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        statusFilter === filter.value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <LoadingRows />
              ) : visibleInvoices.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Customer</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Total</th>
                        <th className="px-6 py-3 font-medium">Paid</th>
                        <th className="px-6 py-3 font-medium">Balance</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3"><span className="sr-only">Open</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleInvoices.map((invoice) => (
                        <tr className="transition-colors hover:bg-blue-50/60" key={invoice.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                                {getCustomerInitials(invoice)}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-slate-900">
                                  {getCustomerName(invoice)}
                                </span>
                                <span className="mt-1 block truncate text-xs text-slate-500">
                                  {invoice.customer_phone || "No phone number"}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {formatInvoiceDate(invoice.invoice_date)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {formatCurrency(invoice.paid_amount)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {formatCurrency(invoice.balance)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`h-6 gap-1.5 rounded-full px-2.5 font-semibold capitalize ${statusStyle(invoice.status)}`}
                              variant="outline"
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {invoice.status !== "paid" ? (
                                <Button
                                  aria-label={`Edit invoice for ${getCustomerName(invoice)}`}
                                  className="size-8 text-slate-400 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => setDialogInvoice(invoice)}
                                  size="icon"
                                  title="Edit invoice"
                                  variant="ghost"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              ) : null}
                            <Link
                              aria-label={`Manage invoice for ${getCustomerName(invoice)}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                              href={`/invoices/${invoice.id}`}
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    {search ? <Search className="size-5" /> : <Banknote className="size-5" />}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {search ? "No matching invoices" : "No invoices yet"}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    {search
                      ? "Try another customer name or phone number."
                      : "Create your first invoice to start tracking payments."}
                  </p>
                  {!search ? (
                    <Button
                      className="mt-5 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => setDialogInvoice("new")}
                    >
                      <FilePlus2 className="size-4" />
                      Create invoice
                    </Button>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
      <InvoiceFormDialog
        invoice={dialogInvoice && dialogInvoice !== "new" ? dialogInvoice : undefined}
        onOpenChange={(open) => {
          if (!open) setDialogInvoice(null)
        }}
        open={dialogInvoice !== null}
      />
    </div>
  )
}
