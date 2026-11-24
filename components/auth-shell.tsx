import { Check, FileText, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

export const authAppearance = {
  elements: {
    rootBox: "h-full !w-full !min-w-0 !max-w-[34rem]",
    cardBox:
      "h-full !w-full !min-w-0 !flex !flex-col !justify-center !bg-transparent !shadow-none",
    card: "!w-full !min-w-0 !max-w-none !border-transparent !bg-transparent !shadow-none",
    footer:
      "mx-auto w-full !max-w-[calc(100%_-_5rem)] !bg-transparent !shadow-none",
    footerAction: "w-full !border-0 !bg-slate-50/70",
    footerItem: "w-full !border-0 !bg-transparent",
  },
}

export function AuthShell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-w-0 max-w-7xl items-stretch gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] lg:gap-12">
        <section className="relative hidden overflow-hidden rounded-[2rem] bg-slate-800 p-8 text-white shadow-xl shadow-slate-900/10 lg:flex lg:flex-col lg:justify-between xl:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-blue-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 -left-32 size-[30rem] rounded-full bg-sky-400/10 blur-3xl"
          />

          <div className="relative">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <FileText className="size-5" />
              </span>
              <span>
                <span className="block text-base font-semibold tracking-tight">
                  Invoice Tracker
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  A calmer way to get paid
                </span>
              </span>
            </Link>

            <div className="mt-10 max-w-xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                <Sparkles className="size-3.5" />
                Your business, in focus
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-[-0.045em] xl:text-5xl">
                Invoices made clear.
                <span className="mt-1 block text-sky-300">
                  Payments kept close.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Create a polished invoice, keep every balance in view, and know
                exactly what is still outstanding.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Check className="size-4" />
              </span>
              <p className="mt-3 text-sm font-medium">Know what is paid</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Keep pending, partial, and paid invoices organized.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
              <span className="flex size-8 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                <ShieldCheck className="size-4" />
              </span>
              <p className="mt-3 text-sm font-medium">Your workspace stays yours</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Sign in securely and keep customer records private.
              </p>
            </div>
          </div>
        </section>

        <section className="auth-clerk mx-auto flex w-full min-w-0 max-w-lg flex-col items-center rounded-[2rem] border border-slate-200/80 bg-white px-4 py-5 shadow-xl shadow-slate-900/10 sm:px-6 lg:py-8">
          <Link className="mb-7 inline-flex items-center gap-3 lg:hidden" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Invoice Tracker
            </span>
          </Link>

          <div className="w-full flex-1">{children}</div>
        </section>
      </div>
    </main>
  )
}
