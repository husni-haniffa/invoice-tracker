import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { authAppearance, AuthShell } from "@/components/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="w-full animate-pulse rounded-3xl bg-white"
          />
        }
      >
        <SignIn appearance={authAppearance} />
      </Suspense>
    </AuthShell>
  );
}
