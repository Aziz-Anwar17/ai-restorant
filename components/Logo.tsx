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
          d="M14 11h7.5c5.2 0 9 3.8 9 9s-3.8 9-9 9H14V11zm4.2 4v10h3.1c3 0 4.9-2 4.9-5s-1.9-5-4.9-5h-3.1z"
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
        Dapur AI
      </span>
    </span>
  );
}
