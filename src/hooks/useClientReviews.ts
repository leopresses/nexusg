import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ClientReview {
  id: string;
  user_id: string;
  client_id: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  review_date: string | null;
  source: string;
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
}

interface CreateReviewPayload {
  client_id: string;
  author_name: string;
  rating: number;
  comment: string;
  review_date?: string;
}

export function useClientReviews(clientId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!user || !clientId) {
      setReviews([]);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("client_reviews")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews((data as ClientReview[]) || []);
    }
    setIsLoading(false);
  }, [user, clientId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (payload: CreateReviewPayload) => {
    if (!user) return;
    const { error } = await supabase.from("client_reviews").insert({
      user_id: user.id,
      client_id: payload.client_id,
      author_name: payload.author_name,
      rating: payload.rating,
      comment: payload.comment,
      review_date: payload.review_date || null,
      source: "manual",
    });
    if (error) {
      console.error("[createReview]", error);
      toast({ title: "Erro ao salvar avaliação", description: "Tente novamente.", variant: "destructive" });
    } else {
      toast({ title: "Avaliação adicionada!" });
      await fetchReviews();
    }
  };

  const updateReview = async (id: string, changes: Partial<ClientReview>) => {
    const { error } = await supabase
      .from("client_reviews")
      .update(changes)
      .eq("id", id);
    if (error) {
      console.error("[updateReview]", error);
      toast({ title: "Erro ao atualizar", description: "Tente novamente.", variant: "destructive" });
    } else {
      toast({ title: "Avaliação atualizada!" });
      await fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("client_reviews").delete().eq("id", id);
    if (error) {
      console.error("[deleteReview]", error);
      toast({ title: "Erro ao excluir", description: "Tente novamente.", variant: "destructive" });
    } else {
      toast({ title: "Avaliação excluída!" });
      await fetchReviews();
    }
  };

  return { reviews, isLoading, createReview, updateReview, deleteReview, refetch: fetchReviews };
}
