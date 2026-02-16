import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Ajustado para fundo azul sólido, texto branco e bordas arredondadas premium
          toast:
            "group toast group-[.toaster]:!bg-blue-600 group-[.toaster]:!text-white group-[.toaster]:border-none group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:font-bold",
          description: "group-[.toast]:!text-blue-50/90",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-blue-600",
          cancelButton: "group-[.toast]:bg-blue-700 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
