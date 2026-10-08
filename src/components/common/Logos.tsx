import React from 'react';
import akwaIbomCrestImg from '../../assets/images/akwa_ibom_crest_1791434140170.jpg';
import ariseAgendaLogoSvg from '../../assets/images/arise_agenda_logo.svg';

/**
 * Official Human Capital Development (HCD) Logo
 * Matching images (1).jpeg: Three stylized figures (lime, green, deep green)
 * emerging with raised arms from an open keyhole circular arch.
 */
export const HcdLogo: React.FC<{
  className?: string;
  size?: number;
  withBackground?: boolean;
}> = ({
  className = 'w-8 h-8',
  size,
  withBackground = false,
}) => {
  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Human Capital Development (HCD) Logo"
    >
      {withBackground && (
        <>
          <rect width="320" height="320" rx="160" fill="url(#hcd-bg)" />
          <defs>
            <radialGradient id="hcd-bg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f4f9f5" />
              <stop offset="100%" stopColor="#e3ede6" />
            </radialGradient>
          </defs>
        </>
      )}

      {/* --- 1. Left Figure: Smallest (Lime Green #82C341) --- */}
      <g id="figure-left">
        {/* Head */}
        <circle cx="68" cy="180" r="17" fill="#82C341" />
        {/* Raised Body & Outstretched Arms */}
        <path
          d="M 66 198
             C 54 184, 34 164, 25 152
             C 28 160, 48 188, 56 200
             C 65 212, 78 226, 92 238
             C 93 230, 84 212, 74 200
             C 86 186, 106 162, 114 148
             C 108 158, 92 186, 84 206
             C 78 202, 72 200, 66 198 Z"
          fill="#82C341"
        />
        {/* Smooth torso anchor */}
        <path
          d="M 64 200
             C 76 192, 92 205, 96 230
             C 85 228, 68 215, 64 200 Z"
          fill="#82C341"
        />
      </g>

      {/* --- 2. Middle Figure: Medium (Vibrant Green #22B14C) --- */}
      <g id="figure-middle">
        {/* Head */}
        <circle cx="112" cy="104" r="24" fill="#22B14C" />
        {/* Left Arm, Right Arm & Torso */}
        <path
          d="M 100 128
             C 75 102, 50 78, 42 68
             C 50 82, 80 122, 98 142
             C 92 165, 106 202, 130 216
             C 142 198, 136 156, 128 142
             C 145 110, 164 74, 172 58
             C 165 78, 138 126, 126 150
             C 114 144, 106 138, 100 128 Z"
          fill="#22B14C"
        />
      </g>

      {/* --- 3. Right Figure: Tallest (Deep Forest Green #0B5D26) --- */}
      <g id="figure-right">
        {/* Head */}
        <circle cx="218" cy="88" r="30" fill="#0B5D26" />
        {/* Left Arm, High Right Arm & Robust Torso */}
        <path
          d="M 198 120
             C 182 82, 168 38, 162 20
             C 172 42, 192 92, 204 130
             C 180 168, 172 200, 172 220
             C 195 218, 238 184, 246 138
             C 272 106, 298 82, 308 72
             C 298 88, 262 130, 244 146
             C 222 132, 210 128, 198 120 Z"
          fill="#0B5D26"
        />
      </g>

      {/* --- 4. Central Open Circular Keyhole Arch (#0B5D26) --- */}
      <g id="central-arch" fill="#0B5D26">
        {/* Concentric curved arch with open notch at base */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 160 178
             C 204.18 178, 240 213.82, 240 258
             C 240 274.5, 234.8, 289.8, 226 302
             L 194 302
             C 198.8 289.5, 202 274, 202 258
             C 202 234.8, 183.2 216, 160 216
             C 136.8 216, 118 234.8, 118 258
             C 118 274, 121.2 289.5, 126 302
             L 94 302
             C 85.2 289.8, 80 274.5, 80 258
             C 80 213.82, 115.82 178, 160 178 Z"
        />
        {/* Inner keyhole opening bevel */}
        <path
          d="M 160 226
             C 177.67 226, 192 240.33, 192 258
             C 192 268, 187 278, 180 286
             L 168 286
             L 166 266
             A 12 12 0 1 0 154 266
             L 152 286
             L 140 286
             C 133 278, 128 268, 128 258
             C 128 240.33, 142.33 226, 160 226 Z"
        />
      </g>
    </svg>
  );
};

/**
 * Official Government of Akwa Ibom State Seal / Crest
 * Replaces the ARISE logo in the dual-logo section per user request.
 * Displays the high-resolution circular crest:
 * "GOVERNMENT OF AKWA IBOM STATE, NIGERIA - 1987 THE LAND OF PROMISE"
 */
export const AkwaIbomStateLogo: React.FC<{
  className?: string;
  size?: number;
  alt?: string;
}> = ({
  className = 'w-10 h-10',
  size,
  alt = 'Government of Akwa Ibom State Official Crest',
}) => {
  return (
    <img
      src={akwaIbomCrestImg}
      alt={alt}
      className={`rounded-full object-contain shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
      loading="eager"
    />
  );
};

/**
 * Official ARISE Agenda Logo
 * Features the 5 rising sun figures and the bold ARISE wordmark in forest green.
 */
export const AriseAgendaLogo: React.FC<{
  className?: string;
  size?: number;
  alt?: string;
}> = ({
  className = 'w-10 h-10',
  size,
  alt = 'Akwa Ibom State ARISE Agenda Logo',
}) => {
  return (
    <img
      src={ariseAgendaLogoSvg}
      alt={alt}
      className={`object-contain shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      loading="eager"
    />
  );
};

// Aliases for clean importing
export const AriseLogo = AriseAgendaLogo;
export const AksLogo = AkwaIbomStateLogo;
export const AksSealLogo = AkwaIbomStateLogo;

/**
 * Combined Dual Emblem Component
 * Displays the Akwa Ibom State ARISE Agenda logo paired with the HCD Core Emblem
 */
export const AksHcdDualLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  orientation?: 'horizontal' | 'stacked';
  showLabel?: boolean;
}> = ({
  size = 'md',
  variant = 'dark',
  orientation = 'horizontal',
  showLabel = true,
}) => {
  const isDark = variant === 'dark';
  const sizeClasses = {
    sm: { hcd: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    md: { hcd: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]' },
    lg: { hcd: 'w-16 h-16', text: 'text-lg', sub: 'text-xs' },
  }[size];

  return (
    <div
      className={`flex ${
        orientation === 'horizontal' ? 'items-center gap-3' : 'flex-col items-center gap-2'
      }`}
    >
      {/* HCD Logo with Crest Border */}
      <div className="flex items-center justify-center bg-white/95 p-1.5 rounded-xl border border-[#D4AF37]/50 shadow-xs">
        <HcdLogo className={sizeClasses.hcd} />
      </div>

      {showLabel && (
        <div className="leading-tight text-left">
          <span
            className={`font-black tracking-tight block ${sizeClasses.text} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            AKS-HCD PORTAL
          </span>
          <span
            className={`uppercase tracking-wider font-semibold block ${sizeClasses.sub} ${
              isDark ? 'text-[#D4AF37]' : 'text-emerald-800'
            }`}
          >
            ARISE Agenda · 31 LGAs
          </span>
        </div>
      )}
    </div>
  );
};
