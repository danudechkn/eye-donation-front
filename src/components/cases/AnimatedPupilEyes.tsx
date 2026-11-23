"use client";

/** ไอคอนดวงตาสำหรับหน้าว่าง (Empty state) */
export function AnimatedPupilEyes({
  className = "w-14 h-14 text-slate-400",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 256 256" className={className} fill="currentColor">
      <defs>
        <clipPath id="left-eye-clip">
          <ellipse cx="80" cy="128" rx="38" ry="60" />
        </clipPath>
        <clipPath id="right-eye-clip">
          <ellipse cx="176" cy="128" rx="38" ry="60" />
        </clipPath>
      </defs>
      <g className="animate-blink">
        <ellipse
          cx="80"
          cy="128"
          rx="38"
          ry="60"
          fill="#f8fafc"
          stroke="currentColor"
          strokeWidth="12"
        />
        <ellipse
          cx="176"
          cy="128"
          rx="38"
          ry="60"
          fill="#f8fafc"
          stroke="currentColor"
          strokeWidth="12"
        />

        <g clipPath="url(#left-eye-clip)">
          <g className="animate-pupil">
            <circle cx="80" cy="128" r="20" fill="currentColor" />
            <circle cx="73" cy="120" r="6" fill="#ffffff" />
          </g>
        </g>

        <g clipPath="url(#right-eye-clip)">
          <g className="animate-pupil">
            <circle cx="176" cy="128" r="20" fill="currentColor" />
            <circle cx="169" cy="120" r="6" fill="#ffffff" />
          </g>
        </g>
      </g>
    </svg>
  );
}
