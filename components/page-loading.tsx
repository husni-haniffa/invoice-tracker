export function PageLoading() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-4"
    >
      <div className="w-full max-w-sm animate-pulse space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-9 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>
    </main>
  )
}
