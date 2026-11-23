import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { authAppearance, AuthShell } from "@/components/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="w-full animate-pulse rounded-3xl bg-white"
          />
        }
      >
        <SignUp appearance={authAppearance} />
      </Suspense>
    </AuthShell>
  );
}
