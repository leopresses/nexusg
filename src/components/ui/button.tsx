import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        // AJUSTE GLOBAL: Azul Nexus com sombra suave e brilho no hover
        default: "bg-blue-600 text-white shadow-md shadow-blue-200/50 hover:bg-blue-700 border-none",

        // AJUSTE GLOBAL: Vermelho sólido para ações críticas
        destructive: "bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-red-700 border-none",

        // AJUSTE GLOBAL: Contorno elegante para o tema branco
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm",

        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",

        ghost: "text-slate-600 hover:bg-blue-50 hover:text-blue-600",

        link: "text-blue-600 underline-offset-4 hover:underline",

        // AJUSTE GLOBAL: Botão de destaque da Landing Page
        hero: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xl shadow-blue-200/50 hover:opacity-90",

        glass: "bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-white shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-[20px] px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
