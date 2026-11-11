/** A little cursed VRChat-meme face wearing a VR headset - the app's brand mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="โลโก้ 3 ชั่วโมงไร้ค่า">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A4D" />
          <stop offset="100%" stopColor="#D2431A" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="35" r="25" fill="url(#logo-grad)" />
      <path
        d="M9 31 Q3 35 9 41 M55 31 Q61 35 55 41"
        stroke="#2B1408"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="9" y="24" width="46" height="20" rx="10" fill="#2B1408" />
      <circle cx="22" cy="34" r="7.5" fill="#FFB59B" />
      <circle cx="42" cy="34" r="7.5" fill="#FFB59B" />
      <path d="M18 30 L26 38 M26 30 L18 38" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="42" cy="34" r="3.2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M42 30.8 a3.2 3.2 0 0 1 0 6.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path
        d="M21 48 Q32 57 43 48"
        stroke="#2B1408"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M50 8 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z" fill="#facc15" />
      <path d="M11 10 l1 2.3 2.3 1 -2.3 1 -1 2.3 -1 -2.3 -2.3 -1 2.3 -1z" fill="#38bdf8" />
    </svg>
  );
}
