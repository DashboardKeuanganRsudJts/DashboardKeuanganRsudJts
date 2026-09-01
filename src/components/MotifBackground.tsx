import React from 'react';

export const MotifBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.15]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dna-motif" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            {/* Outline pill top-left - Green */}
            <path
              d="M 20 60 A 20 20 0 0 1 60 60 L 60 120 A 20 20 0 0 1 20 120 Z"
              fill="none"
              stroke="#66bb6a"
              strokeWidth="4"
            />
            {/* Outline pill top-right - Blue */}
            <path
              d="M 120 40 A 20 20 0 0 1 160 40 L 160 80 A 20 20 0 0 1 120 80 Z"
              fill="none"
              stroke="#29b6f6"
              strokeWidth="4"
            />
            {/* Outline L-shape bottom-right - Green */}
            <path
              d="M 120 120 A 20 20 0 0 1 160 120 L 160 160 A 20 20 0 0 1 120 160 L 80 160 A 20 20 0 0 1 80 120 Z"
              fill="none"
              stroke="#66bb6a"
              strokeWidth="4"
            />
            {/* Outline pill bottom-left - Blue */}
            <path
              d="M 60 160 A 20 20 0 0 1 100 160 L 100 200 A 20 20 0 0 1 60 200 Z"
              fill="none"
              stroke="#29b6f6"
              strokeWidth="4"
            />
            {/* Connector pill center - Green */}
            <path
              d="M 80 80 A 20 20 0 0 1 120 80 L 120 120 A 20 20 0 0 1 80 120 Z"
              fill="none"
              stroke="#8bc34a"
              strokeWidth="4"
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dna-motif)" />
      </svg>
    </div>
  );
};
