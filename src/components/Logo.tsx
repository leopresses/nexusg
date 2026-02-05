import { forwardRef } from "react";
import { Layers } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({ size = "md", showText = true }, ref) => {
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shadow-sm border border-white/15 bg-gradient-to-br from-[#4F86FF] to-[#2D62F1]`}
      >
        <Layers className="h-2/3 w-2/3 text-white" strokeWidth={2.25} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão <span className="text-[#2D62F1]">Nexus</span>
          </span>
        </div>
      )}
    </div>
  );
});

Logo.displayName = "Logo";
