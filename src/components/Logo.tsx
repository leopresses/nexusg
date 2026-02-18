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

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({
  size = "md",
  showText = true,
}, ref) => {
  const px = sizePx[size];

  return (
    <div ref={ref} className="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="Gestão Nexus"
        width={px}
        height={px}
        className="rounded-xl object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão <span className="text-gradient-gold">Nexus</span>
          </span>
        </div>
      )}
    </div>
  );
});

Logo.displayName = "Logo";