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
          className="fill-primary"
        />

        {/* Coffee liquid */}
        <path
          d="M22 42 L22 78 A8 8 0 0 0 30 86 L70 86 A8 8 0 0 0 78 78 L78 42 Z"
          className="fill-background"
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
        <ellipse cx="50" cy="40" rx="30" ry="5" className="fill-primary-foreground" />

        {/* Handle */}
        <path
          d="M80 50 Q95 50 95 65 Q95 80 80 80"
          fill="none"
          className="stroke-primary"
          strokeWidth="5"
        />

        {/* CRM letters */}
        {isAnimating && (
          <>
            <text
              x="35"
              y="35"
              fontFamily="Arial"
              fontSize="14"
              className="fill-primary-foreground font-bold"
              opacity="0.8"
            >
              <animate attributeName="y" values="35;25;35" dur="2s" repeatCount="indefinite" />C
            </text>
            <text
              x="50"
              y="35"
              fontFamily="Arial"
              fontSize="14"
              className="fill-primary-foreground font-bold"
              opacity="0.8"
            >
              <animate attributeName="y" values="35;20;35" dur="2.3s" repeatCount="indefinite" />R
            </text>
            <text
              x="65"
              y="35"
              fontFamily="Arial"
              fontSize="14"
              className="fill-primary-foreground font-bold"
              opacity="0.8"
            >
              <animate attributeName="y" values="35;25;35" dur="2.6s" repeatCount="indefinite" />M
            </text>
          </>
        )}

        {/* Steam */}
        {isAnimating && (
          <>
            <path d="M35 35 Q40 25 45 35" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
              <animate
                attributeName="d"
                values="M35 35 Q40 25 45 35; M35 30 Q40 20 45 30; M35 35 Q40 25 45 35"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M50 30 Q55 20 60 30" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
              <animate
                attributeName="d"
                values="M50 30 Q55 20 60 30; M50 25 Q55 15 60 25; M50 30 Q55 20 60 30"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M65 35 Q70 25 75 35" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
              <animate
                attributeName="d"
                values="M65 35 Q70 25 75 35; M65 30 Q70 20 75 30; M65 35 Q70 25 75 35"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}
      </svg>
      {!isAnimating && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-muted-foreground animate-pulse">
          Click the cup to see the magic!
        </div>
      )}
    </div>
  );
}
