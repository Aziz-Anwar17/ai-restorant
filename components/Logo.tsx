export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="12" fill="url(#dg)" />
        <path
          d="M18 10h4l7 20h-4.3l-1.4-4.3h-6.6L15.3 30H11l7-20zm2 4.9l-2.2 6.9h4.4L20 14.9z"
          fill="#fff"
        />
        <defs>
          <linearGradient id="dg" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#7c5cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-bold tracking-tight text-white">
        AI Restorant
      </span>
    </span>
  );
}
