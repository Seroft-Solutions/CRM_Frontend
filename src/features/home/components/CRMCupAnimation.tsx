'use client';

import { useState } from 'react';

export default function CRMCupAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <div className="relative w-72 h-72 cursor-pointer" onClick={() => setIsAnimating(!isAnimating)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Cup body */}
        <path
          d="M20 40 L20 80 A10 10 0 0 0 30 90 L70 90 A10 10 0 0 0 80 80 L80 40 Z"
          fill="var(--sidebar)"
        />

        {/* Coffee liquid */}
        <path
          d="M22 42 L22 78 A8 8 0 0 0 30 86 L70 86 A8 8 0 0 0 78 78 L78 42 Z"
          fill="var(--sidebar-foreground)"
        >
          {isAnimating && (
            <animate
              attributeName="d"
              values="M22 42 L22 78 A8 8 0 0 0 30 86 L70 86 A8 8 0 0 0 78 78 L78 42 Z;
                     M22 45 L22 78 A8 8 0 0 0 30 86 L70 86 A8 8 0 0 0 78 78 L78 45 Z;
                     M22 42 L22 78 A8 8 0 0 0 30 86 L70 86 A8 8 0 0 0 78 78 L78 42 Z"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Cup rim */}
        <ellipse cx="50" cy="40" rx="30" ry="5" fill="var(--sidebar-accent)" />

        {/* Handle */}
        <path
          d="M80 50 Q95 50 95 65 Q95 80 80 80"
          fill="none"
          stroke="var(--sidebar-accent)"
          strokeWidth="5"
        />

        {/* CRM letters */}
        {isAnimating && (
          <>
            {['C', 'R', 'M'].map((char, index) => (
              <text
                key={char}
                x={35 + index * 15}
                y="35"
                fontFamily="Arial"
                fontSize="14"
                fill="var(--sidebar-foreground)"
                opacity="0.85"
                fontWeight="700"
              >
                <animate attributeName="y" values="35;25;35" dur={`${2 + index * 0.3}s`} repeatCount="indefinite" />
                {char}
              </text>
            ))}
          </>
        )}

        {/* Steam */}
        {isAnimating && (
          <>
            {[35, 50, 65].map((startX, idx) => (
              <path
                key={startX}
                d={`M${startX} 35 Q${startX + 5} 25 ${startX + 10} 35`}
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              >
                <animate
                  attributeName="d"
                  values={`M${startX} 35 Q${startX + 5} 25 ${startX + 10} 35; M${startX} 30 Q${startX + 5} 20 ${startX + 10} 30; M${startX} 35 Q${startX + 5} 25 ${startX + 10} 35`}
                  dur={`${2 + idx * 0.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.2;0.6"
                  dur={`${2 + idx * 0.5}s`}
                  repeatCount="indefinite"
                />
              </path>
            ))}
          </>
        )}
      </svg>
      {!isAnimating && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-white/70 animate-pulse">
          Click the cup to see the magic!
        </div>
      )}
    </div>
  );
}
