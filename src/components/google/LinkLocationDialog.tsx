import { useState, useEffect } from "react";
import { Loader2, Search, MapPin, Building2, Check, X, Unlink } from "lucide-react";
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
import { useGoogleConnection, type GoogleLocation, type ClientGoogleLocation } from "@/hooks/useGoogleConnection";

interface LinkLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentLocation?: ClientGoogleLocation | null;
  onSuccess: () => void;
}

export function LinkLocationDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentLocation,
  onSuccess,
}: LinkLocationDialogProps) {
  const {
    connection,
    locations,
    isLoadingLocations,
    fetchLocations,
    linkLocationToClient,
    unlinkLocationFromClient,
  } = useGoogleConnection();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (open && connection?.status === "connected") {
      fetchLocations();
    }
  }, [open, connection?.status, fetchLocations]);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Google Business</DialogTitle>
          <DialogDescription>
            Selecione a localização do Google Business para "{clientName}"
          </DialogDescription>
        </DialogHeader>

        {currentLocation && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{currentLocation.location_title}</p>
                  <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoadingLocations ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-10">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhuma localização encontrada com esse termo."
                  : "Nenhuma localização disponível na sua conta Google Business."}
              </p>
            </div>
          ) : (
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
                          {location.accountName}
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
