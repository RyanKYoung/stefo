/** Stefo logo: a calendar page with a medical cross in the body. */
export function StefoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Stefo"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="7"
        width="32"
        height="29"
        rx="4"
        fill="var(--color-surface)"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
      />
      <path
        d="M4 15h32"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M13 4v6M27 4v6"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 20v10M15 25h10"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
