/**
 * Stefo logo: a calendar page with a gold binding and a rehab-cross body.
 * Deliberately our own mark — this is an internal scheduling tool, not an
 * official Keck Medicine property, so it doesn't borrow their identity.
 */
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
        x="4.5"
        y="8.5"
        width="31"
        height="27"
        rx="3.5"
        fill="var(--color-cardinal)"
      />
      <path d="M4.5 12a3.5 3.5 0 0 1 3.5-3.5h24a3.5 3.5 0 0 1 3.5 3.5v3.5h-31V12Z" fill="var(--color-gold)" />
      <path
        d="M12 5.5v5M28 5.5v5"
        stroke="var(--color-cardinal)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 20v10M15 25h10"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
