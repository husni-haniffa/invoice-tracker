import { Suspense } from "react"
import { InvoiceDetails } from "@/components/invoice-details"
import { PageLoading } from "@/components/page-loading"
import { requireSignedInUser } from "@/lib/auth"

export default function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <AuthenticatedInvoiceDetails params={params} />
    </Suspense>
  )
}

async function AuthenticatedInvoiceDetails({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSignedInUser()
  const { id } = await params
  return <InvoiceDetails invoiceId={id} />
}
