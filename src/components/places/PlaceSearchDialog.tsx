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
  const { isSearching, isFetchingDetails, candidates, searchError, searchPlaces, fetchPlaceDetails, clearSearch } =
    usePlacesSearch();

  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [manualPlaceId, setManualPlaceId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

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
      .filter((t) => typeMap[t])
      .map((t) => typeMap[t])
      .slice(0, 2);

    return mapped.length > 0 ? mapped.join(", ") : "Negócio";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !bg-white !text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Vincular Google Place ID</DialogTitle>
          <DialogDescription className="text-slate-500">
            Busque o negócio no Google ou insira o Place ID manualmente
          </DialogDescription>
        </DialogHeader>

        {currentPlaceId && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Place ID atual:</span>
              <code className="text-xs bg-white border border-blue-100 px-2 py-0.5 rounded text-blue-700 font-mono">
                {currentPlaceId}
              </code>
            </div>
          </div>
        )}

        {!showManualInput ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="searchName" className="text-xs text-slate-700">
                  Nome do negócio
                </Label>
                <Input
                  id="searchName"
                  placeholder="Ex: Pizzaria Roma"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9 !bg-white !text-slate-900 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="searchAddress" className="text-xs text-slate-700">
                  Cidade/Endereço
                </Label>
                <Input
                  id="searchAddress"
                  placeholder="Ex: São Paulo"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="h-9 !bg-white !text-slate-900 border-slate-200"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || (!searchName.trim() && !searchAddress.trim())}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar no Google
            </Button>

            {searchError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
            )}

            {candidates.length > 0 && (
              <ScrollArea className="h-[240px] rounded-lg border border-slate-100 p-1">
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.place_id}
                      onClick={() => handleSelectCandidate(candidate)}
                      disabled={isFetchingDetails}
                      className="w-full text-left rounded-lg border border-slate-200 p-3 bg-white hover:bg-slate-50 hover:border-blue-300 transition-colors disabled:opacity-50 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <MapPin className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-slate-900 truncate">{candidate.name}</p>
                          <p className="text-xs text-slate-500 truncate">{candidate.formatted_address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{formatTypes(candidate.types)}</span>
                            {candidate.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
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

            {!isSearching && !searchError && candidates.length === 0 && (searchName || searchAddress) && (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Clique em "Buscar no Google" para encontrar o negócio</p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(true)}
              className="w-full text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            >
              Prefiro inserir o Place ID manualmente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualPlaceId" className="text-slate-700">
                Google Place ID
              </Label>
              <Input
                id="manualPlaceId"
                placeholder="ChIJ..."
                value={manualPlaceId}
                onChange={(e) => setManualPlaceId(e.target.value)}
                className="!bg-white !text-slate-900 border-slate-200"
              />
              <p className="text-xs text-slate-500">
                Cole o Place ID obtido no{" "}
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Place ID Finder
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowManualInput(false)}
                className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Voltar
              </Button>
              <Button
                onClick={handleManualSave}
                disabled={isFetchingDetails || !manualPlaceId.trim()}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
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

        <DialogFooter className="border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
