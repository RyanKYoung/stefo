import { StefoMark } from "@/components/stefo-mark";
import { FACILITY } from "@/lib/facility";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="h-1 bg-[var(--color-cardinal)]" />

          <div className="px-8 pt-9 pb-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <StefoMark className="h-12 w-12" />
              <h1 className="mt-4 text-[24px] leading-tight font-semibold tracking-tight text-[var(--color-ink)]">
                {FACILITY.program}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                {FACILITY.hospital}
                <br />
                <span className="text-[var(--color-ink-faint)]">
                  {FACILITY.unit}
                </span>
              </p>
            </div>

            <div className="mb-7 flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5">
              <span
                aria-hidden="true"
                className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-[var(--color-gold)]"
              />
              <p className="text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
                <strong className="font-semibold text-[var(--color-ink)]">
                  Demo sign-in.
                </strong>{" "}
                Any email and password will get you in — real accounts arrive
                with Supabase.
              </p>
            </div>

            <LoginForm next={next ?? "/calendar"} />
          </div>
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[var(--color-ink-faint)]">
          Accounts are issued by your clinical education coordinator.
          <br />
          {FACILITY.address}
        </p>
      </div>
    </main>
  );
}
