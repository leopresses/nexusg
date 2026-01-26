import { Network } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12"
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl"
};

export function Logo({
  size = "md",
  showText = true
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} gradient-gold rounded-xl flex items-center justify-center shadow-gold`}>
        <Network className="h-2/3 w-2/3 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
            Gestão <span className="text-gradient-gold">Nexus</span>
          </span>
        </div>
      )}
    </div>
  );
}