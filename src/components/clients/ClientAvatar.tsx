import { useClientAvatarUrl } from "@/hooks/useClientAvatarUrl";
import { useMemo } from "react";

interface ClientAvatarProps {
  avatarUrl: string | null;
  clientName: string;
  className?: string;
}

/**
 * Componente para exibir o avatar do cliente com suporte a URLs assinadas.
 * No Gestão Nexus, este componente garante que cada foto esteja vinculada
 * corretamente ao seu respectivo cliente.
 */
export function ClientAvatar({ avatarUrl, clientName, className = "" }: ClientAvatarProps) {
  // O hook gera a URL assinada do Supabase baseada no caminho do arquivo
  const signedUrl = useClientAvatarUrl(avatarUrl);

  // Memoiza a inicial para performance e consistência visual
  const initials = useMemo(() => {
    return clientName ? clientName.charAt(0).toUpperCase() : "?";
  }, [clientName]);

  // Se houver uma URL assinada e um caminho de avatar válido
  if (signedUrl && avatarUrl) {
    return (
      <img
        // A prop 'key' força o React a tratar cada imagem como única,
        // resolvendo o problema de fotos repetidas entre clientes diferentes.
        key={avatarUrl}
        src={signedUrl}
        alt={clientName}
        className={`h-full w-full object-cover transition-opacity duration-300 ${className}`}
        onError={(e) => {
          // Fallback caso a imagem falhe ao carregar
          e.currentTarget.style.display = "none";
          if (e.currentTarget.parentElement) {
            e.currentTarget.parentElement.classList.add("bg-slate-100");
          }
        }}
      />
    );
  }

  // Renderização padrão para o tema claro do Gestão Nexus
  return (
    <div
      className={`flex items-center justify-center h-full w-full bg-slate-100 text-slate-600 font-bold ${className}`}
    >
      {initials}
    </div>
  );
}
