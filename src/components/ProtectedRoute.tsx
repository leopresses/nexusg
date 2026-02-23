import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [adminVerified, setAdminVerified] = useState<boolean | null>(requireAdmin ? null : true);

  // Server-side admin verification to prevent client-side role manipulation
  useEffect(() => {
    if (!requireAdmin || !user || isLoading) return;

    let cancelled = false;
    const verify = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as const,
      });
      if (!cancelled) setAdminVerified(!!data);
    };
    verify();
    return () => { cancelled = true; };
  }, [requireAdmin, user, isLoading]);

  if (isLoading || adminVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !adminVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
