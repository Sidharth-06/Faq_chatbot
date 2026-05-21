'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  speed?: number;
  className?: string;
  glowColor?: string;
}

export default function ShinyText({
  text,
  speed = 3.5,
  className = '',
}: ShinyTextProps) {
  return (
    <span className={`custom-shiny-text inline-block font-extrabold select-none ${className}`}>
      {text}
      <style>{`
        .custom-shiny-text {
          background-image: linear-gradient(110deg, #A82C24, 40%, #ff887f, 50%, #A82C24, 60%) !important;
          background-size: 200% 100% !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          display: inline-block !important;
          animation: shiny-text-sweep ${speed}s linear infinite !important;
        }
        @keyframes shiny-text-sweep {
          0% { background-position: 150% 0; }
          100% { background-position: -150% 0; }
        }
      `}</style>
    </span>
  );
}
