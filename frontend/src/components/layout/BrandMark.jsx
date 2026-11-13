/** The logo: a document with one line marked, which is what the app does. */
export default function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <rect x="8" y="9" width="16" height="3" rx="1.5" fill="#ffffff" opacity="0.55" />
      <rect x="8" y="14.5" width="16" height="3" rx="1.5" fill="#ffffff" />
      <rect x="8" y="20" width="10" height="3" rx="1.5" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
