"use client"

import { UserButton } from "@clerk/nextjs"
import { FileText } from "lucide-react"
import Link from "next/link"

export function WorkspaceHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <FileText className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-slate-950">
              Invoice Tracker
            </span>
            <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              Billing workspace
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            href="/"
          >
            All invoices
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
