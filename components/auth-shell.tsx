import { ArrowUpRight, Check, FileText, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

export const authAppearance = {
  elements: {
    rootBox: "w-full !max-w-[34rem] lg:min-h-[42rem]",
    cardBox:
      "w-full lg:min-h-[42rem] lg:!flex lg:!flex-col lg:!justify-center lg:!bg-transparent lg:!shadow-none",
    card: "w-full !max-w-none lg:!border-transparent lg:!bg-transparent lg:!shadow-none",
  },
}

export function AuthShell({
  children,
  mode,
}: {
  children: ReactNode
  mode: "sign-in" | "sign-up"
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl items-center gap-8 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] lg:gap-16">
        <section className="relative hidden min-h-[42.125rem] overflow-hidden rounded-[2rem] bg-[#191a2d] p-10 text-white shadow-2xl shadow-indigo-950/10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-violet-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 -left-32 size-[30rem] rounded-full bg-indigo-400/15 blur-3xl"
          />

          <div className="relative">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-950/30">
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

            <div className="mt-24 max-w-xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                <Sparkles className="size-3.5" />
                Your business, in focus
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.12] tracking-[-0.045em] xl:text-6xl">
                Invoices made clear.
                <span className="mt-1 block text-violet-300">
                  Payments kept close.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
                Create a polished invoice, keep every balance in view, and know
                exactly what is still outstanding.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Check className="size-4" />
              </span>
              <p className="mt-4 text-sm font-medium">Know what is paid</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Keep pending, partial, and paid invoices organized.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <ShieldCheck className="size-4" />
              </span>
              <p className="mt-4 text-sm font-medium">Your workspace stays yours</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Sign in securely and keep customer records private.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-lg flex-col items-center">
          <Link className="mb-7 inline-flex items-center gap-3 lg:hidden" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <FileText className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Invoice Tracker
            </span>
          </Link>

          <div className="auth-clerk w-full lg:relative lg:flex lg:min-h-[42.125rem] lg:items-center lg:justify-center lg:rounded-[2rem] lg:border lg:border-slate-200/80 lg:bg-white lg:px-5 lg:shadow-2xl lg:shadow-indigo-950/10">
            {children}
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 lg:absolute lg:bottom-6 lg:mt-0">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Secure {mode === "sign-in" ? "sign in" : "account creation"} with Clerk
              <ArrowUpRight className="size-3" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
