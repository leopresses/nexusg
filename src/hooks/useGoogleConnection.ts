import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GoogleConnection {
  user_id: string;
  google_email: string | null;
  status: "connected" | "error" | "disconnected";
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleLocation {
  name: string;
  title: string;
  address: string;
  accountName: string;
}

export interface ClientGoogleLocation {
  id: string;
  user_id: string;
  client_id: string;
  location_name: string;
  location_title: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGoogleConnection() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  
  // Ref to prevent concurrent fetches
  const isLoadingLocationsRef = useRef(false);

  const fetchConnection = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("google_user_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data as GoogleConnection | null);
    } catch (error) {
      console.error("Error fetching Google connection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const connect = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para conectar o Google.");
      return;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-auth-connect", {
        body: { redirectUrl: window.location.origin },
      });

      if (error) {
        // Try to extract meaningful error from response
        const errorData = error as any;
        const code = errorData?.code || errorData?.message || "unknown";
        const message = errorData?.message || getErrorMessage(code);
        console.error("Google connect error:", code, message);
        toast.error(message);
        setIsConnecting(false);
        return;
      }

      if (data?.error) {
        // Handle structured error response
        const message = data.message || getErrorMessage(data.code);
        console.error("Google connect returned error:", data.code, data.message);
        toast.error(message);
        setIsConnecting(false);
        return;
      }

      if (data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error("Erro ao gerar URL de autenticação. Tente novamente.");
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error("Error connecting Google:", error);
      toast.error("Erro ao conectar com Google. Tente novamente.");
      setIsConnecting(false);
    }
  };

  // Map error codes to user-friendly messages
  const getErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      // Auth errors
      "NO_AUTH_HEADER": "Sessão expirada. Faça login novamente.",
      "INVALID_TOKEN": "Token inválido. Faça login novamente.",
      "NO_USER_ID": "Usuário não identificado. Faça login novamente.",
      
      // Config errors
      "MISSING_CLIENT_ID": "Configuração do Google não encontrada. Contate o suporte.",
      "config_error": "Erro de configuração. Contate o suporte.",
      
      // Google OAuth errors
      "access_denied": "Acesso negado. Você precisa permitir as permissões solicitadas.",
      "redirect_uri_mismatch": "Erro de configuração OAuth (redirect_uri). Contate o suporte.",
      "invalid_client": "Credenciais OAuth inválidas. Contate o suporte.",
      "invalid_grant": "Código de autorização expirado. Tente novamente.",
      
      // State errors
      "state_expired": "Sessão de autenticação expirada. Tente novamente.",
      "invalid_state": "Erro de validação de segurança. Tente novamente.",
      "missing_params": "Resposta incompleta do Google. Tente novamente.",
      
      // Token errors
      "token_exchange_failed": "Falha ao obter tokens do Google. Tente novamente.",
      "no_access_token": "Google não retornou token de acesso. Tente novamente.",
      
      // Database errors
      "database_error": "Erro ao salvar conexão. Tente novamente.",
      
      // Generic
      "internal_error": "Erro interno. Tente novamente ou contate o suporte.",
      "google_error": "Erro do Google. Tente novamente.",
    };
    
    return messages[code] || `Erro: ${code}. Tente novamente.`;
  };

  const disconnect = async () => {
    if (!user) return;

    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("google-auth-disconnect");

      if (error) throw error;

      setConnection(null);
      setLocations([]);
      toast.success("Google desconectado com sucesso!");
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      toast.error("Erro ao desconectar do Google.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchLocations = useCallback(async () => {
    if (!user) {
      console.log("[fetchLocations] No user, skipping");
      return [];
    }
    
    if (connection?.status !== "connected") {
      console.log("[fetchLocations] Connection status:", connection?.status);
      return [];
    }

    // Prevent duplicate calls using ref (stable across renders)
    if (isLoadingLocationsRef.current) {
      console.log("[fetchLocations] Already loading, skipping");
      return locations; // Return current locations
    }

    console.log("[fetchLocations] Starting fetch for user:", user.id);
    isLoadingLocationsRef.current = true;
    setIsLoadingLocations(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("google-list-locations");

      if (error) {
        console.error("[fetchLocations] Edge function error:", error);
        throw error;
      }

      const fetchedLocations = data?.locations || [];
      console.log("[fetchLocations] Found locations:", fetchedLocations.length);
      setLocations(fetchedLocations);
      return fetchedLocations;
    } catch (error: any) {
      console.error("[fetchLocations] Error:", error);
      // Don't show toast here - let the component handle it to avoid loops
      setLocations([]);
      throw error; // Re-throw so component can handle
    } finally {
      isLoadingLocationsRef.current = false;
      setIsLoadingLocations(false);
    }
  }, [user, connection?.status]);

  const syncMetrics = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-sync-metrics");

      if (error) throw error;

      toast.success(`Métricas sincronizadas! ${data?.synced || 0} registros atualizados.`);
      await fetchConnection();
    } catch (error) {
      console.error("Error syncing metrics:", error);
      toast.error("Erro ao sincronizar métricas.");
    } finally {
      setIsSyncing(false);
    }
  };

  const linkLocationToClient = async (
    clientId: string,
    location: GoogleLocation
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("client_google_locations").upsert(
        {
          user_id: user.id,
          client_id: clientId,
          location_name: location.name,
          location_title: location.title,
          address: location.address,
          is_active: true,
        },
        { onConflict: "client_id" }
      );

      if (error) throw error;

      toast.success("Localização vinculada com sucesso!");
      return true;
    } catch (error) {
      console.error("Error linking location:", error);
      toast.error("Erro ao vincular localização.");
      return false;
    }
  };

  const unlinkLocationFromClient = async (clientId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("client_google_locations")
        .update({ is_active: false })
        .eq("client_id", clientId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Vínculo removido com sucesso!");
      return true;
    } catch (error) {
      console.error("Error unlinking location:", error);
      toast.error("Erro ao remover vínculo.");
      return false;
    }
  };

  const getClientLocation = async (clientId: string): Promise<ClientGoogleLocation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("client_google_locations")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as ClientGoogleLocation | null;
    } catch (error) {
      console.error("Error fetching client location:", error);
      return null;
    }
  };

  return {
    connection,
    isLoading,
    isConnecting,
    isDisconnecting,
    isSyncing,
    locations,
    isLoadingLocations,
    connect,
    disconnect,
    fetchConnection,
    fetchLocations,
    syncMetrics,
    linkLocationToClient,
    unlinkLocationFromClient,
    getClientLocation,
  };
}
