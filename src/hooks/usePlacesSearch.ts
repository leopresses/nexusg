import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlaceCandidate {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  photos?: { photo_reference: string }[];
  business_status?: string;
}

export function usePlacesSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (name: string, address: string): Promise<PlaceCandidate[]> => {
    if (!name.trim() && !address.trim()) {
      setCandidates([]);
      return [];
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const { data, error } = await supabase.functions.invoke("places-search", {
        body: { name, address },
      });

      if (error) {
        console.error("[usePlacesSearch] Function error:", error);
        setSearchError("Erro ao buscar lugares. Tente novamente.");
        setCandidates([]);
        return [];
      }

      if (data.error) {
        console.error("[usePlacesSearch] API error:", data.error, data.message);
        // If API key not configured, show specific message
        if (data.error === "CONFIG_ERROR") {
          setSearchError("Busca de Place ID ainda não disponível. Você pode inserir o Place ID manualmente.");
        } else {
          setSearchError(data.message || "Erro ao buscar lugares.");
        }
        setCandidates([]);
        return [];
      }

      const results = data.candidates || [];
      setCandidates(results);
      return results;
    } catch (err: any) {
      console.error("[usePlacesSearch] Error:", err);
      setSearchError("Erro de conexão. Tente novamente.");
      setCandidates([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchPlaceDetails = useCallback(async (
    placeId: string, 
    clientId?: string
  ): Promise<PlaceDetails | null> => {
    setIsFetchingDetails(true);

    try {
      const { data, error } = await supabase.functions.invoke("places-details", {
        body: { place_id: placeId, client_id: clientId },
      });

      if (error) {
        console.error("[usePlacesSearch] fetchDetails error:", error);
        return null;
      }

      if (data.error) {
        console.error("[usePlacesSearch] fetchDetails API error:", data.error, data.message);
        return null;
      }

      return data.details || null;
    } catch (err: any) {
      console.error("[usePlacesSearch] fetchDetails exception:", err);
      return null;
    } finally {
      setIsFetchingDetails(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setCandidates([]);
    setSearchError(null);
  }, []);

  return {
    isSearching,
    isFetchingDetails,
    candidates,
    searchError,
    searchPlaces,
    fetchPlaceDetails,
    clearSearch,
  };
}
