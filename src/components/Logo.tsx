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
      <div className="relative shrink-0" style={{ width: px, height: px }} aria-hidden="true">
        <img
          src="/logo.png"
          alt="Gestão Nexus"
          width={px}
          height={px}
          className="block object-contain"
          style={{ width: px, height: px }}
        />
      </div>

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
