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
      {/* ÍCONE (SVG) */}
      <div className="relative shrink-0" style={{ width: px, height: px }} aria-hidden="true">
        <svg width={px} height={px} viewBox="0 0 64 64" className="block" role="img" aria-label="Gestão Nexus">
          <defs>
            {/* Borda neon */}
            <linearGradient id="nexusBorder" x1="6" y1="6" x2="58" y2="58">
              <stop offset="0%" stopColor="#22F7B7" />
              <stop offset="55%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Fundo dark */}
            <radialGradient id="nexusBg" cx="30%" cy="25%" r="80%">
              <stop offset="0%" stopColor="#0B1B3A" />
              <stop offset="70%" stopColor="#07132A" />
              <stop offset="100%" stopColor="#050B16" />
            </radialGradient>

            {/* Gradiente do "N" */}
            <linearGradient id="nexusStroke" x1="14" y1="14" x2="50" y2="50">
              <stop offset="0%" stopColor="#2BFF9A" />
              <stop offset="60%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Glow suave */}
            <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow forte só pros nós */}
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.85 0"
                result="g"
              />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base */}
          <rect
            x="6"
            y="6"
            width="52"
            height="52"
            rx="14"
            fill="url(#nexusBg)"
            stroke="url(#nexusBorder)"
            strokeWidth="2.2"
          />

          {/* “N” estilizado */}
          <g filter="url(#softGlow)">
            {/* perna esquerda */}
            <path d="M20 44 V20" stroke="url(#nexusStroke)" strokeWidth="6" strokeLinecap="round" />
            {/* diagonal */}
            <path d="M20 22 L44 40" stroke="url(#nexusStroke)" strokeWidth="6" strokeLinecap="round" />
            {/* perna direita */}
            <path d="M44 44 V24" stroke="url(#nexusStroke)" strokeWidth="6" strokeLinecap="round" />

            {/* nós (bolinhas) */}
            <g filter="url(#nodeGlow)">
              <circle cx="20" cy="20" r="4.2" fill="#2BFF9A" />
              <circle cx="44" cy="44" r="4.2" fill="#3B82F6" />
              {/* brilho interno */}
              <circle cx="19" cy="19" r="1.6" fill="#E8FFF8" opacity="0.75" />
              <circle cx="43" cy="43" r="1.6" fill="#EAF2FF" opacity="0.75" />
            </g>
          </g>
        </svg>
      </div>

      {/* TEXTO (sem subtítulo) */}
      {showText && (
        <div className="leading-none">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Nexus
            </span>
          </span>
        </div>
      )}
    </div>
  );
});

Logo.displayName = "Logo";
