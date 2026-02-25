import { forwardRef } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizePx = {
  sm: 32,
  md: 40,
  lg: 48,
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({ size = "md", showText = true }, ref) => {
  const px = sizePx[size];

  return (
    <div ref={ref} className="flex items-center gap-3">
      {/* Logo Vetorial (SVG) - substitui /logo.png */}
      <div className="relative shrink-0" style={{ width: px, height: px }} aria-hidden="true">
        <svg width={px} height={px} viewBox="0 0 64 64" className="block" role="img" aria-label="Gestão Nexus">
          <defs>
            <linearGradient id="nexusStroke" x1="8" y1="8" x2="56" y2="56">
              <stop offset="0%" stopColor="#00FF88" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>

            <linearGradient id="nexusFill" x1="0" y1="0" x2="0" y2="64">
              <stop offset="0%" stopColor="#071226" />
              <stop offset="100%" stopColor="#050B16" />
            </linearGradient>

            <filter id="nexusGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                    0 0 0 0 0
                    0 0 0 0 1
                    0 0 0 0 0.6
                    0 0 0 0.6 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
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
            fill="url(#nexusFill)"
            stroke="url(#nexusStroke)"
            strokeWidth="2"
            opacity="0.98"
          />

          {/* Glow outline */}
          <rect
            x="6"
            y="6"
            width="52"
            height="52"
            rx="14"
            fill="transparent"
            stroke="url(#nexusStroke)"
            strokeWidth="2"
            filter="url(#nexusGlow)"
            opacity="0.55"
          />

          {/* "N" moderno com conexão */}
          <g filter="url(#nexusGlow)">
            {/* esquerda */}
            <path d="M22 42V22" stroke="url(#nexusStroke)" strokeWidth="5" strokeLinecap="round" />
            {/* diagonal */}
            <path d="M22 24L42 40" stroke="url(#nexusStroke)" strokeWidth="5" strokeLinecap="round" />
            {/* direita */}
            <path d="M42 42V22" stroke="url(#nexusStroke)" strokeWidth="5" strokeLinecap="round" />

            {/* nós (bolinhas) */}
            <circle cx="22" cy="22" r="3.2" fill="#00FF88" />
            <circle cx="42" cy="42" r="3.2" fill="#00E5FF" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão <span className="text-gradient-neon">Nexus</span>
          </span>
          <span className="mt-1 text-xs text-muted-foreground">SEO Local • Automação • Relatórios</span>
        </div>
      )}
    </div>
  );
});

Logo.displayName = "Logo";
