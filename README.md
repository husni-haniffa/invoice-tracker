# Invoice Tracker

Invoice Tracker is a Clerk-authenticated invoice tracker built with Next.js, TanStack Query, TanStack Form, shadcn/ui, and Supabase.

## Features

- Create invoices with a customer name or phone number, a selectable invoice date, and one or more items.
- Track the invoice subtotal, total paid, and remaining balance in LKR.
- Manage payment as pending, partial, or paid, with cash or bank transfer recorded as the method.
- Search customers by name or phone number; dashboard totals reflect the matching invoices.
- Keep each user's invoices isolated with Supabase Row Level Security and their Clerk identity.

## Setup

1. Configure the Clerk sign-in and sign-up URLs as `/sign-in` and `/sign-up`, with both fallback redirect URLs set to `/`.
2. Connect the same Clerk instance used by this app to your Supabase project using Clerk's [Supabase integration setup](https://dashboard.clerk.com/setup/supabase). Then, in that same Supabase project, add Clerk under **Authentication → Third-Party Auth**. Use the matching Clerk development or production instance and ensure its session tokens include the `authenticated` role used by the database policies. Sign out and back in after connecting so Clerk issues a fresh session token.
3. Keep the project's Clerk and Supabase credentials in `.env.local`:

   ```dotenv
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

4. Apply `supabase/migrations/20261123000000_create_invoices.sql` once from this workspace:

   ```powershell
   pnpm add -D supabase
   pnpm exec supabase init
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <your-project-ref>
   pnpm exec supabase db push
   ```

   Find `<your-project-ref>` in the Supabase Dashboard URL (`https://supabase.com/dashboard/project/<project-ref>`). The link command prompts for your database password. `db push` shows the pending migration before applying it. If you prefer, paste the migration file into the project's Supabase **SQL Editor** and run it once instead.
5. Install dependencies and start the app:

   ```bash
   pnpm install
   pnpm dev
   ```

The app sends the Clerk session token to Supabase on the server. No Supabase service-role key or Clerk JWT template is used. Invoice creation is handled by a database function so invoice totals and line items are saved atomically.
