import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GoogleOAuthTroubleshooting } from "./GoogleOAuthTroubleshooting";

export function GoogleIntegrationSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const {
    connection,
    isLoading,
    isConnecting,
    isDisconnecting,
    isSyncing,
    connect,
    disconnect,
    fetchConnection,
    syncMetrics,
  } = useGoogleConnection();

  // Map error codes to user-friendly messages
  const getErrorMessage = (code: string, details?: string): string => {
    const messages: Record<string, string> = {
      "access_denied": "Acesso negado. Você precisa permitir as permissões solicitadas.",
      "redirect_uri_mismatch": "Erro de configuração OAuth. O URI de redirecionamento não está autorizado no Google Cloud Console.",
      "invalid_client": "Credenciais OAuth inválidas. Verifique GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
      "invalid_grant": "Código de autorização expirado ou já utilizado. Tente novamente.",
      "state_expired": "Sessão de autenticação expirada (limite: 10 min). Tente novamente.",
      "invalid_state": "Erro de validação de segurança. Tente novamente.",
      "missing_params": "Resposta incompleta do Google. Tente novamente.",
      "token_exchange_failed": "Falha ao obter tokens do Google. Tente novamente.",
      "no_access_token": "Google não retornou token de acesso. Tente novamente.",
      "database_error": "Erro ao salvar conexão no banco de dados. Tente novamente.",
      "config_error": `Erro de configuração do servidor${details ? ` (${details})` : ""}. Contate o suporte.`,
      "internal_error": "Erro interno do servidor. Tente novamente ou contate o suporte.",
      "google_error": "Erro retornado pelo Google. Tente novamente.",
      "auth_failed": "Autenticação falhou. Tente novamente.",
    };
    
    return messages[code] || details || "Erro desconhecido. Tente novamente.";
  };

  // Handle OAuth callback - this runs when user returns from Google
  useEffect(() => {
    const authResult = searchParams.get("google_auth");
    if (authResult) {
      if (authResult === "success") {
        toast.success("Google Business conectado com sucesso!", {
          description: "Sua conta foi vinculada. Agora você pode sincronizar métricas.",
          duration: 5000,
        });
        // Force refresh connection status
        fetchConnection();
      } else if (authResult === "error") {
        const code = searchParams.get("code") || searchParams.get("message") || "unknown";
        const details = searchParams.get("details") || undefined;
        const message = getErrorMessage(code, details);
        console.error("Google OAuth error:", { code, details });
        toast.error(message, { 
          description: `Código: ${code}`,
          duration: 8000 
        });
      }
      // Clear URL params without triggering navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, fetchConnection]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (connection?.status) {
      case "connected":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Não conectado
          </Badge>
        );
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <CardTitle>Google Business Profile</CardTitle>
              <CardDescription>
                Conecte sua conta para sincronizar métricas automaticamente
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.status === "connected" && (
          <>
            <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conta Google</span>
                <span className="text-sm font-medium">{connection.google_email || "—"}</span>
              </div>
              {connection.last_sync_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última sincronização</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(connection.last_sync_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={syncMetrics} 
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar Agora
              </Button>
              <Button 
                variant="destructive" 
                onClick={disconnect} 
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </Button>
            </div>
          </>
        )}

        {connection?.status === "error" && (
          <>
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">
                {connection.error_message || "Ocorreu um erro com a conexão. Por favor, reconecte sua conta."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={connect} disabled={isConnecting} className="flex-1">
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reconectar
              </Button>
              <Button 
                variant="outline" 
                onClick={disconnect} 
                disabled={isDisconnecting}
              >
                Desconectar
              </Button>
            </div>
          </>
        )}

        {(!connection || connection.status === "disconnected") && (
          <>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Google Business para sincronizar métricas como visualizações, 
                ligações, rotas e cliques automaticamente para seus clientes.
              </p>
            </div>
            <Button onClick={connect} disabled={isConnecting} className="w-full">
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Conectar Google Business
            </Button>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          A sincronização automática ocorre diariamente às 06:00. Você também pode sincronizar 
          manualmente a qualquer momento.
        </p>
      </CardContent>
    </Card>
    
    {/* Admin-only troubleshooting guide */}
    {isAdmin && <GoogleOAuthTroubleshooting />}
    </>
  );
}
