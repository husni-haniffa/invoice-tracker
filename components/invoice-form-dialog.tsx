"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { CreateInvoiceForm } from "@/components/create-invoice-form"
import type { Invoice } from "@/lib/invoices"

export function InvoiceFormDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice?: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(96vw,72rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl outline-none sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-950">
                {invoice ? "Edit invoice" : "Create invoice"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                {invoice
                  ? "Change the customer details or invoice items."
                  : "Add a customer and the items you are billing for."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close invoice form"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <CreateInvoiceForm
            key={invoice?.id ?? "new"}
            inDialog
            invoice={invoice}
            onCancel={() => onOpenChange(false)}
            onSaved={() => onOpenChange(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
