import { Suspense } from "react"
import { CreateInvoiceForm } from "@/components/create-invoice-form"
import { PageLoading } from "@/components/page-loading"
import { requireSignedInUser } from "@/lib/auth"

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AuthenticatedNewInvoicePage />
    </Suspense>
  )
}

async function AuthenticatedNewInvoicePage() {
  await requireSignedInUser()
  return <CreateInvoiceForm />
}
