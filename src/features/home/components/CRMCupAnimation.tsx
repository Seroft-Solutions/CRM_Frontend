'use client';

const floatingBeans = [
  { id: 'bean-1', delay: '0s', startX: 32 },
  { id: 'bean-2', delay: '0.8s', startX: 52 },
  { id: 'bean-3', delay: '1.6s', startX: 68 },
];

export default function CRMCupAnimation() {
  return (
    <div role="img" aria-label="Illustration of the CRM Cup" className="relative w-72 h-72">
      <div className="absolute inset-0 rounded-[36%] opacity-80 bg-[radial-gradient(circle_at_top,_#0f172a,_#0f1c2f_55%,_transparent_70%)] blur-3xl" />
      <svg viewBox="0 0 120 120" className="relative z-10 w-full h-full">
        <defs>
          <linearGradient id="cup-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="cup-shadow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f213b" />
            <stop offset="100%" stopColor="#0b1a30" />
          </linearGradient>
          <linearGradient id="brew" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5b81d" />
            <stop offset="100%" stopColor="#f7c94f" />
          </linearGradient>
          <radialGradient id="foam" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="#fff9e6" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#f5b81d" stopOpacity="0" />
          </radialGradient>
          <clipPath id="liquid-clip">
            <path d="M22 44 L22 88 Q22 108 42 108 L78 108 Q98 108 98 88 L98 44Z" />
          </clipPath>
        </defs>

        <ellipse cx="60" cy="104" rx="45" ry="12" fill="#000" opacity="0.25" />

        <path
          d="M98 52 Q116 52 116 74 Q116 96 98 96"
          fill="none"
          stroke="var(--sidebar-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        <path
          d="M22 44 L22 96 Q22 112 42 112 L78 112 Q98 112 98 96 L98 44Z"
          fill="url(#cup-shadow)"
        />

        <path
          d="M20 40 L20 94 Q20 114 42 114 L78 114 Q100 114 100 94 L100 40Z"
          fill="url(#cup-body)"
          stroke="#092038"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <g clipPath="url(#liquid-clip)">
          <rect x="22" y="44" width="76" height="44" fill="url(#brew)">
            <animate attributeName="y" values="44;46;44" dur="4s" repeatCount="indefinite" />
          </rect>
          <path
            d="M22 60 Q52 54 78 60 T122 60 L122 100 L22 100Z"
            fill="url(#foam)"
            opacity="0.8"
          >
            <animate
              attributeName="d"
              values="M22 60 Q52 54 78 60 T122 60 L122 100 L22 100Z;
                      M22 58 Q52 56 78 58 T122 58 L122 100 L22 100Z;
                      M22 60 Q52 54 78 60 T122 60 L122 100 L22 100Z"
              dur="5s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        <ellipse cx="60" cy="40" rx="40" ry="8" fill="url(#brew)" stroke="#092038" strokeWidth="3" />

        {[30, 60, 90].map((x, idx) => (
          <path
            key={x}
            d={`M${x} 32 Q${x + 3} 20 ${x} 12`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          >
            <animate
              attributeName="d"
              values={`M${x} 32 Q${x + 3} 20 ${x} 12; M${x - 2} 22 Q${x + 3} 12 ${x - 2} 4; M${x} 32 Q${x + 3} 20 ${x} 12`}
              dur={`${3 + idx * 0.6}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.1;0.4"
              dur={`${3 + idx * 0.6}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}

        {floatingBeans.map(({ id, delay, startX }) => (
          <g key={id} opacity="0.85">
            <ellipse cx={startX} cy="70" rx="2.2" ry="4.2" fill="#0f172a" stroke="#f5b81d" strokeWidth="0.8">
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values={`0 0; 4 -24; -2 -44`}
                dur="4.5s"
                repeatCount="indefinite"
                begin={delay}
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="4.5s"
                repeatCount="indefinite"
                begin={delay}
              />
            </ellipse>
          </g>
        ))}

        <g opacity="0.5">
          {[{ x: 20, y: 26 }, { x: 100, y: 30 }].map((spark, i) => (
            <polygon
              key={`${spark.x}-${spark.y}`}
              points={`${spark.x},${spark.y - 3} ${spark.x + 1.5},${spark.y - 1} ${spark.x + 4},${spark.y} ${spark.x + 1.5},${spark.y + 1} ${spark.x},${spark.y + 3} ${spark.x - 1.5},${spark.y + 1} ${spark.x - 4},${spark.y} ${spark.x - 1.5},${spark.y - 1}`}
              fill="#fef3c7"
            >
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="2.5s"
                repeatCount="indefinite"
                begin={`${i * 0.7}s`}
              />
            </polygon>
          ))}
        </g>
      </svg>
    </div>
  );
}
