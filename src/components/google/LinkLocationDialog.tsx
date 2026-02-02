import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Search, MapPin, Building2, Check, Unlink, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGoogleConnection, type GoogleLocation, type ClientGBPInfo } from "@/hooks/useGoogleConnection";

interface LinkLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentGBPInfo?: ClientGBPInfo | null;
  onSuccess: () => void;
}

export function LinkLocationDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentGBPInfo,
  onSuccess,
}: LinkLocationDialogProps) {
  const {
    connection,
    locations,
    locationsError,
    isLoadingLocations,
    fetchLocations,
    linkLocationToClient,
    unlinkLocationFromClient,
  } = useGoogleConnection();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Track fetch state to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Fetch locations when dialog opens
  const doFetchLocations = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setLocalError(null);
    
    try {
      await fetchLocations();
      hasFetchedRef.current = true;
    } catch (error: any) {
      console.error("[LinkLocationDialog] Fetch error:", error);
      const errorMessage = error?.message || "Erro ao buscar localizações.";
      setLocalError(errorMessage);
      // Show toast only once per fetch attempt
      toast.error(errorMessage);
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchLocations]);

  // Effect to handle dialog open/close
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      hasFetchedRef.current = false;
      isFetchingRef.current = false;
      setLocalError(null);
      setSearchQuery("");
      return;
    }
    
    // Only fetch if dialog is open, connected, and haven't fetched yet
    if (open && connection?.status === "connected" && !hasFetchedRef.current && !isFetchingRef.current) {
      doFetchLocations();
    }
  }, [open, connection?.status, doFetchLocations]);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.accountName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = async (location: GoogleLocation) => {
    setIsLinking(true);
    const success = await linkLocationToClient(clientId, location);
    setIsLinking(false);
    
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    const success = await unlinkLocationFromClient(clientId);
    setIsUnlinking(false);
    
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleRetry = () => {
    hasFetchedRef.current = false;
    setLocalError(null);
    doFetchLocations();
  };

  // Not connected state
  if (connection?.status !== "connected") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Google Business</DialogTitle>
            <DialogDescription>
              Você precisa conectar sua conta Google Business primeiro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Acesse Configurações → Integração Google para conectar sua conta.
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const displayError = localError || locationsError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Google Business</DialogTitle>
          <DialogDescription>
            Selecione a localização do Google Business para "{clientName}"
          </DialogDescription>
        </DialogHeader>

        {/* Current linked location */}
        {currentGBPInfo?.google_connected && currentGBPInfo.gbp_location_name && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{currentGBPInfo.gbp_location_id}</p>
                  <p className="text-sm text-muted-foreground">{currentGBPInfo.gbp_address || "Endereço não disponível"}</p>
                  {currentGBPInfo.last_gbp_sync_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última sincronização: {new Date(currentGBPInfo.last_gbp_sync_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlink}
                disabled={isUnlinking}
                className="text-destructive hover:text-destructive"
              >
                {isUnlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, endereço ou conta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading state */}
          {isLoadingLocations ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando localizações...</p>
            </div>
          ) : displayError ? (
            /* Error state */
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="text-sm font-medium text-destructive mb-1">Erro ao carregar localizações</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {displayError.includes("reconect") || displayError.includes("token")
                    ? "Sua sessão expirou. Reconecte o Google em Configurações → Integrações."
                    : "Verifique se sua conta Google tem um Perfil de Empresa ativo."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isFetchingRef.current}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : filteredLocations.length === 0 ? (
            /* Empty state */
            <div className="text-center py-10">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery
                  ? "Nenhuma localização encontrada com esse termo."
                  : "Nenhuma localização disponível."}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Verifique se você tem acesso a um Perfil de Empresa ativo na sua conta Google.
                </p>
              )}
            </div>
          ) : (
            /* Locations list */
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredLocations.map((location) => (
                  <button
                    key={location.name}
                    onClick={() => handleSelectLocation(location)}
                    disabled={isLinking}
                    className="w-full text-left rounded-lg border border-border p-4 hover:bg-secondary/50 hover:border-primary/30 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{location.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {location.address}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Conta: {location.accountName}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
