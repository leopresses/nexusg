import { useState, useEffect } from "react";
import { Loader2, Search, MapPin, Star, Check, AlertCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlacesSearch, type PlaceCandidate } from "@/hooks/usePlacesSearch";

interface PlaceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  currentPlaceId?: string | null;
  onSuccess: () => void;
}

export function PlaceSearchDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientAddress,
  currentPlaceId,
  onSuccess,
}: PlaceSearchDialogProps) {
  const { 
    isSearching, 
    isFetchingDetails, 
    candidates, 
    searchError, 
    searchPlaces, 
    fetchPlaceDetails,
    clearSearch 
  } = usePlacesSearch();

  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [manualPlaceId, setManualPlaceId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchName(clientName || "");
      setSearchAddress(clientAddress || "");
      setManualPlaceId(currentPlaceId || "");
      setShowManualInput(false);
      clearSearch();
    }
  }, [open, clientName, clientAddress, currentPlaceId, clearSearch]);

  const handleSearch = async () => {
    await searchPlaces(searchName, searchAddress);
  };

  const handleSelectCandidate = async (candidate: PlaceCandidate) => {
    const details = await fetchPlaceDetails(candidate.place_id, clientId);
    if (details) {
      toast.success("Place ID vinculado!", {
        description: `${details.name} foi vinculado ao cliente.`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast.error("Erro ao vincular Place ID");
    }
  };

  const handleManualSave = async () => {
    if (!manualPlaceId.trim()) {
      toast.error("Informe um Place ID válido");
      return;
    }

    const details = await fetchPlaceDetails(manualPlaceId.trim(), clientId);
    if (details) {
      toast.success("Place ID vinculado!", {
        description: `${details.name} foi vinculado ao cliente.`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast.error("Place ID inválido ou não encontrado");
    }
  };

  const formatTypes = (types: string[]): string => {
    const typeMap: Record<string, string> = {
      restaurant: "Restaurante",
      cafe: "Café",
      bar: "Bar",
      store: "Loja",
      food: "Alimentação",
      point_of_interest: "Ponto de interesse",
      establishment: "Estabelecimento",
      beauty_salon: "Salão de Beleza",
      hair_care: "Cabeleireiro",
      spa: "Spa",
    };
    
    const mapped = types
      .filter(t => typeMap[t])
      .map(t => typeMap[t])
      .slice(0, 2);
    
    return mapped.length > 0 ? mapped.join(", ") : "Negócio";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Google Place ID</DialogTitle>
          <DialogDescription>
            Busque o negócio no Google ou insira o Place ID manualmente
          </DialogDescription>
        </DialogHeader>

        {currentPlaceId && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Place ID atual:</span>
              <code className="text-xs bg-secondary px-2 py-0.5 rounded">{currentPlaceId}</code>
            </div>
          </div>
        )}

        {!showManualInput ? (
          <div className="space-y-4">
            {/* Search Form */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="searchName" className="text-xs">Nome do negócio</Label>
                <Input
                  id="searchName"
                  placeholder="Ex: Pizzaria Roma"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="searchAddress" className="text-xs">Cidade/Endereço</Label>
                <Input
                  id="searchAddress"
                  placeholder="Ex: São Paulo"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching || (!searchName.trim() && !searchAddress.trim())}
              className="w-full"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar no Google
            </Button>

            {/* Error State */}
            {searchError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{searchError}</p>
              </div>
            )}

            {/* Results */}
            {candidates.length > 0 && (
              <ScrollArea className="h-[240px]">
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.place_id}
                      onClick={() => handleSelectCandidate(candidate)}
                      disabled={isFetchingDetails}
                      className="w-full text-left rounded-lg border border-border p-3 hover:bg-secondary/50 hover:border-primary/30 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.formatted_address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTypes(candidate.types)}
                            </span>
                            {candidate.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-primary">
                                <Star className="h-3 w-3 fill-current" />
                                {candidate.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Empty State */}
            {!isSearching && !searchError && candidates.length === 0 && (searchName || searchAddress) && (
              <div className="text-center py-6">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique em "Buscar no Google" para encontrar o negócio
                </p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(true)}
              className="w-full text-muted-foreground"
            >
              Prefiro inserir o Place ID manualmente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualPlaceId">Google Place ID</Label>
              <Input
                id="manualPlaceId"
                placeholder="ChIJ..."
                value={manualPlaceId}
                onChange={(e) => setManualPlaceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole o Place ID obtido no{" "}
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Place ID Finder
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowManualInput(false)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleManualSave}
                disabled={isFetchingDetails || !manualPlaceId.trim()}
                className="flex-1"
              >
                {isFetchingDetails ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
