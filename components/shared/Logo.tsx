'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  className?: string;
  textColor?: string;
}

export function VakulaaLogo({
  size = 40,
  variant = 'full',
  className = '',
  textColor = '#0F4C25',
}: LogoProps) {
  const Icon = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vakulaa Tiffins logo"
    >
      {/* Outer circle */}
      <circle cx="40" cy="40" r="38" fill="white" stroke="#0F4C25" strokeWidth="2" />

      {/* V shape – dark green base */}
      <path
        d="M16 18 L40 60 L64 18 L56 18 L40 48 L24 18 Z"
        fill="#0F4C25"
      />
      {/* V shape – gold middle stripe */}
      <path
        d="M22 18 L40 52 L58 18 L52 18 L40 44 L28 18 Z"
        fill="#F2C84B"
      />
      {/* V shape – medium green top stripe */}
      <path
        d="M28 18 L40 46 L52 18 L46 18 L40 38 L34 18 Z"
        fill="#1A7A3C"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={className}>
        <Icon />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon />
      <div style={{ color: textColor }}>
        <div
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.45 }}
        >
          Vakulaa
        </div>
        <div
          className="font-sans tracking-widest font-semibold leading-none"
          style={{ fontSize: size * 0.28, letterSpacing: '0.18em', color: '#1A7A3C' }}
        >
          TIFFINS
        </div>
      </div>
    </div>
  );
}

export default VakulaaLogo;
