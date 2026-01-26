import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "1 letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "1 número", met: /[0-9]/.test(password) },
    { label: "1 caractere especial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount === 0 ? 0 : metCount <= 2 ? 1 : metCount === 3 ? 2 : 3;

  const strengthLabel = ["", "Fraca", "Média", "Forte"][strength];
  const strengthColor = ["", "bg-destructive", "bg-warning", "bg-success"][strength];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={cn(
                "flex-1 h-full rounded-full transition-colors",
                strength >= level ? strengthColor : "bg-secondary"
              )}
            />
          ))}
        </div>
        {strengthLabel && (
          <span
            className={cn(
              "text-xs font-medium",
              strength === 1 && "text-destructive",
              strength === 2 && "text-warning",
              strength === 3 && "text-success"
            )}
          >
            {strengthLabel}
          </span>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              req.met ? "text-success" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
