/**
 * A hand-drawn stand-in for the app, used in the hero. Pure SVG so it costs no
 * tiles, no JavaScript and no layout shift — and it animates on its own.
 */
export function RouteIllustration() {
  const pins: [x: number, y: number, color: string][] = [
    [96, 300, "#0ea5e9"],
    [206, 196, "#f59e0b"],
    [318, 268, "#a855f7"],
    [430, 150, "#10b981"],
    [538, 218, "#ef4444"],
  ];

  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label="An abstract map with five numbered stops joined by a glowing route"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#070d18" />
        </linearGradient>
        <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      <rect width="640" height="400" rx="18" fill="url(#sky)" />
      <rect width="640" height="400" rx="18" fill="url(#grid)" />

      {/* City blocks. */}
      <g fill="#111c30" opacity="0.85">
        <rect x="58" y="86" width="120" height="74" rx="7" />
        <rect x="196" y="60" width="86" height="96" rx="7" />
        <rect x="300" y="96" width="112" height="62" rx="7" />
        <rect x="446" y="66" width="128" height="58" rx="7" />
        <rect x="64" y="188" width="96" height="72" rx="7" />
        <rect x="242" y="300" width="132" height="62" rx="7" />
        <rect x="404" y="272" width="104" height="92" rx="7" />
        <rect x="536" y="270" width="62" height="62" rx="7" />
      </g>

      {/* River. */}
      <path
        d="M-10 356 C 120 336, 168 250, 292 236 S 470 262, 560 208 L 660 178"
        fill="none"
        stroke="#12304a"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Route: a faint full path with a bright dash travelling along it. */}
      <path
        id="route"
        d="M96 300 L206 196 L318 268 L430 150 L538 218"
        fill="none"
        stroke="url(#routeStroke)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.28"
      />
      <path
        d="M96 300 L206 196 L318 268 L430 150 L538 218"
        fill="none"
        stroke="url(#routeStroke)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#softGlow)"
        strokeDasharray="120 560"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="680"
          to="0"
          dur="4.5s"
          repeatCount="indefinite"
        />
      </path>

      {pins.map(([x, y, color], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r="15" fill={color} opacity="0.16">
            <animate
              attributeName="r"
              values="15;22;15"
              dur="3s"
              begin={`${index * 0.35}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.18;0;0.18"
              dur="3s"
              begin={`${index * 0.35}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={x} cy={y} r="12" fill={color} stroke="#e8eef8" strokeWidth="2" />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#0b1220"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {index + 1}
          </text>
        </g>
      ))}

      {/* Distance readout, echoing the real panel. */}
      <g>
        <rect x="392" y="308" width="196" height="52" rx="12" fill="#0c111c" opacity="0.92" />
        <rect
          x="392.5"
          y="308.5"
          width="195"
          height="51"
          rx="11.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.09"
        />
        <text x="408" y="330" fontSize="16" fill="#e8eef8" fontFamily="ui-monospace, monospace">
          12.4 km
        </text>
        <text x="408" y="348" fontSize="10" fill="#5a6b86" fontFamily="ui-sans-serif, system-ui">
          5 stops · 2 h 35 min on foot
        </text>
      </g>
    </svg>
  );
}
