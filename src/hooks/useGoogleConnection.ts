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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleLocation {
  name: string; // Full location name for API (e.g., "locations/12345")
  title: string;
  address: string;
  accountId: string;
  accountName: string;
}

export interface ClientGBPInfo {
  gbp_account_id: string | null;
  gbp_location_id: string | null;
  gbp_location_name: string | null;
  gbp_address: string | null;
  google_connected: boolean;
  last_gbp_sync_at: string | null;
  gbp_sync_status: string | null;
  gbp_sync_error: string | null;
}

// Map error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  "NO_AUTH": "Sessão expirada. Faça login novamente.",
  "NO_AUTH_HEADER": "Sessão expirada. Faça login novamente.",
  "INVALID_TOKEN": "Token inválido. Faça login novamente.",
  "NO_USER_ID": "Usuário não identificado. Faça login novamente.",
  
  // Config errors
  "CONFIG_ERROR": "Configuração do servidor incompleta. Contate o suporte.",
  "MISSING_CLIENT_ID": "Configuração do Google não encontrada. Contate o suporte.",
  
  // Connection errors
  "NOT_CONNECTED": "Você precisa conectar sua conta Google primeiro.",
  "NOT_ACTIVE": "Sua conexão Google precisa ser reconectada.",
  "NO_TOKEN": "Token não encontrado. Reconecte sua conta Google.",
  "DECRYPT_ERROR": "Erro no token. Reconecte sua conta Google.",
  
  // Token errors
  "NO_REFRESH_TOKEN": "Sessão expirada. Reconecte sua conta Google.",
  "REFRESH_FAILED": "Não foi possível atualizar o token. Reconecte sua conta Google.",
  
  // Google API errors
  "GOOGLE_ACCESS_DENIED": "Acesso negado pelo Google. Verifique suas permissões ou reconecte.",
  "ACCOUNTS_FETCH_FAILED": "Erro ao buscar contas do Google Business.",
  
  // Generic
  "INTERNAL_ERROR": "Erro interno. Tente novamente.",
  "unknown": "Erro desconhecido. Tente novamente.",
};

export function useGoogleConnection() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  
  // Ref to prevent concurrent fetches
  const isLoadingLocationsRef = useRef(false);

  const fetchConnection = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("google_user_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data as GoogleConnection | null);
    } catch (error) {
      console.error("[useGoogleConnection] Error fetching connection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const getErrorMessage = (code: string): string => {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES["unknown"];
  };

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
        const errorData = error as any;
        const code = errorData?.code || errorData?.message || "unknown";
        toast.error(getErrorMessage(code));
        setIsConnecting(false);
        return;
      }

      if (data?.error) {
        toast.error(data.message || getErrorMessage(data.code));
        setIsConnecting(false);
        return;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Erro ao gerar URL de autenticação. Tente novamente.");
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error("[useGoogleConnection] Error connecting Google:", error);
      toast.error("Erro ao conectar com Google. Tente novamente.");
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!user) return;

    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("google-auth-disconnect");

      if (error) throw error;

      // Also clear google_connected flag from all clients
      await supabase
        .from("clients")
        .update({ 
          google_connected: false,
          gbp_account_id: null,
          gbp_location_id: null,
          gbp_location_name: null,
          gbp_sync_status: "pending",
        })
        .eq("user_id", user.id);

      setConnection(null);
      setLocations([]);
      toast.success("Google desconectado com sucesso!");
    } catch (error) {
      console.error("[useGoogleConnection] Error disconnecting Google:", error);
      toast.error("Erro ao desconectar do Google.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchLocations = useCallback(async (): Promise<GoogleLocation[]> => {
    if (!user) {
      console.log("[fetchLocations] No user, skipping");
      return [];
    }
    
    if (connection?.status !== "connected") {
      console.log("[fetchLocations] Not connected, status:", connection?.status);
      return [];
    }

    // Prevent duplicate calls
    if (isLoadingLocationsRef.current) {
      console.log("[fetchLocations] Already loading, returning cached locations");
      return locations;
    }

    console.log("[fetchLocations] Starting fetch for user:", user.id);
    isLoadingLocationsRef.current = true;
    setIsLoadingLocations(true);
    setLocationsError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("google-list-locations");

      if (error) {
        console.error("[fetchLocations] Edge function error:", error);
        const message = "Erro ao buscar localizações do Google Business.";
        setLocationsError(message);
        throw new Error(message);
      }

      // Check for structured error response
      if (data?.error && data?.code) {
        const message = data.message || getErrorMessage(data.code);
        console.log("[fetchLocations] API returned error:", data.code, message);
        
        // Only set error if not just "no locations found"
        if (data.code !== "NOT_CONNECTED" && data.locations?.length === 0) {
          setLocationsError(message);
        }
        
        setLocations(data.locations || []);
        return data.locations || [];
      }

      const fetchedLocations = data?.locations || [];
      console.log("[fetchLocations] Found locations:", fetchedLocations.length);
      setLocations(fetchedLocations);
      return fetchedLocations;
    } catch (error: any) {
      console.error("[fetchLocations] Error:", error);
      const message = error?.message || "Erro ao buscar localizações.";
      setLocationsError(message);
      setLocations([]);
      throw error;
    } finally {
      isLoadingLocationsRef.current = false;
      setIsLoadingLocations(false);
    }
  }, [user, connection?.status, locations]);

  const syncMetrics = async (clientId?: string) => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-sync-metrics", {
        body: clientId ? { client_id: clientId } : {},
      });

      if (error) throw error;

      const message = clientId 
        ? `Métricas sincronizadas!`
        : `Métricas sincronizadas! ${data?.synced || 0} clientes atualizados.`;
      toast.success(message);
      await fetchConnection();
    } catch (error) {
      console.error("[useGoogleConnection] Error syncing metrics:", error);
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
      // Update the client with GBP info (new architecture)
      const { error } = await supabase
        .from("clients")
        .update({
          gbp_account_id: location.accountId,
          gbp_location_id: location.name.split("/").pop() || location.name, // Extract ID from full name
          gbp_location_name: location.name, // Full name for API calls
          gbp_address: location.address,
          google_connected: true,
          gbp_sync_status: "pending",
          gbp_sync_error: null,
        })
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Google Business vinculado com sucesso!");
      return true;
    } catch (error) {
      console.error("[useGoogleConnection] Error linking location:", error);
      toast.error("Erro ao vincular localização.");
      return false;
    }
  };

  const unlinkLocationFromClient = async (clientId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          gbp_account_id: null,
          gbp_location_id: null,
          gbp_location_name: null,
          gbp_address: null,
          google_connected: false,
          gbp_sync_status: "pending",
          gbp_sync_error: null,
        })
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Vínculo removido com sucesso!");
      return true;
    } catch (error) {
      console.error("[useGoogleConnection] Error unlinking location:", error);
      toast.error("Erro ao remover vínculo.");
      return false;
    }
  };

  const getClientGBPInfo = async (clientId: string): Promise<ClientGBPInfo | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("gbp_account_id, gbp_location_id, gbp_location_name, gbp_address, google_connected, last_gbp_sync_at, gbp_sync_status, gbp_sync_error")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as ClientGBPInfo;
    } catch (error) {
      console.error("[useGoogleConnection] Error fetching client GBP info:", error);
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
    locationsError,
    isLoadingLocations,
    connect,
    disconnect,
    fetchConnection,
    fetchLocations,
    syncMetrics,
    linkLocationToClient,
    unlinkLocationFromClient,
    getClientGBPInfo,
  };
}
