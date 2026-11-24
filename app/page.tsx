import { Suspense } from "react"
import { InvoiceDashboard } from "@/components/invoice-dashboard"
import { PageLoading } from "@/components/page-loading"
import { requireSignedInUser } from "@/lib/auth"

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AuthenticatedDashboard />
    </Suspense>
  )
}

async function AuthenticatedDashboard() {
  await requireSignedInUser()
  return <InvoiceDashboard />
}
