export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
      <path d="M20 12v32h32" fill="none" stroke="var(--accent-contrast)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 20h32v32"
        fill="none"
        stroke="var(--accent-contrast)"
        strokeOpacity=".55"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="7" fill="var(--accent-contrast)" />
    </svg>
  )
}
