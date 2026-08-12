import { StefoMark } from "@/components/stefo-mark";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-10 shadow-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <StefoMark className="h-11 w-11" />
            <div>
              <h1 className="text-[22px] font-normal text-[var(--color-ink)]">
                Sign in to Stefo
              </h1>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                Your hospital work calendar
              </p>
            </div>
          </div>

          <p className="mb-6 rounded-md bg-[#fef7e0] px-3 py-2 text-[13px] leading-snug text-[#8a6116]">
            <strong className="font-medium">Demo sign-in.</strong> Any email and
            password will get you in — real accounts arrive with Supabase.
          </p>

          <LoginForm next={next ?? "/calendar"} />
        </div>

        <p className="mt-6 text-center text-[13px] text-[var(--color-ink-faint)]">
          Accounts are issued by your scheduling administrator.
        </p>
      </div>
    </main>
  );
}
