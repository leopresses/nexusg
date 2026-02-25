import { forwardRef } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizePx = {
  sm: 30,
  md: 36,
  lg: 44,
};

const textSizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({ size = "md", showText = true }, ref) => {
  const px = sizePx[size];

  return (
    <div ref={ref} className="flex items-center gap-3">
      {/* ÍCONE PREMIUM (SVG) */}
      <div className="relative shrink-0" style={{ width: px, height: px }} aria-hidden="true">
        <svg width={px} height={px} viewBox="0 0 64 64" className="block" role="img" aria-label="Gestão Nexus">
          <defs>
            {/* Fundo dark premium, bem discreto */}
            <radialGradient id="nxBg" cx="35%" cy="25%" r="85%">
              <stop offset="0%" stopColor="#0B1A33" />
              <stop offset="70%" stopColor="#071226" />
              <stop offset="100%" stopColor="#050B16" />
            </radialGradient>

            {/* Borda sutil (quase “luxo”) */}
            <linearGradient id="nxBorder" x1="6" y1="6" x2="58" y2="58">
              <stop offset="0%" stopColor="#2A3A63" />
              <stop offset="60%" stopColor="#1D2A4D" />
              <stop offset="100%" stopColor="#142042" />
            </linearGradient>

            {/* “N” discreto com leve acento teal */}
            <linearGradient id="nxStroke" x1="16" y1="16" x2="48" y2="48">
              <stop offset="0%" stopColor="#9FEFE0" />
              <stop offset="55%" stopColor="#6BD6E8" />
              <stop offset="100%" stopColor="#8FB6FF" />
            </linearGradient>

            {/* sombra super suave, sem neon */}
            <filter id="nxShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.35 0"
                result="shadow"
              />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base */}
          <rect
            x="7"
            y="7"
            width="50"
            height="50"
            rx="14"
            fill="url(#nxBg)"
            stroke="url(#nxBorder)"
            strokeWidth="1.5"
          />

          {/* “N” mais premium (menos grosso, sem glow) */}
          <g filter="url(#nxShadow)">
            <path d="M22 44 V20" stroke="url(#nxStroke)" strokeWidth="5.2" strokeLinecap="round" />
            <path d="M22 22 L42 40" stroke="url(#nxStroke)" strokeWidth="5.2" strokeLinecap="round" />
            <path d="M42 44 V24" stroke="url(#nxStroke)" strokeWidth="5.2" strokeLinecap="round" />

            {/* nós pequenos, sem brilho forte */}
            <circle cx="22" cy="20" r="3.2" fill="#9FEFE0" opacity="0.95" />
            <circle cx="42" cy="44" r="3.2" fill="#8FB6FF" opacity="0.95" />
          </g>
        </svg>
      </div>

      {/* TEXTO (premium, limpo) */}
      {showText && (
        <div className="leading-none">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Nexus
            </span>
          </span>
        </div>
      )}
    </div>
  );
});

Logo.displayName = "Logo";
