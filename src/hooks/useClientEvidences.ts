import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ClientEvidence {
  id: string;
  user_id: string;
  client_id: string;
  type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
}

const EVIDENCE_TYPES = [
  { value: "cnpj", label: "CNPJ / Registro" },
  { value: "licenca", label: "Licença / Alvará" },
  { value: "conta_luz", label: "Conta de Luz" },
  { value: "conta_agua", label: "Conta de Água" },
  { value: "fachada", label: "Foto da Fachada" },
  { value: "interior", label: "Foto Interior" },
  { value: "outros", label: "Outros" },
] as const;

export { EVIDENCE_TYPES };

export function useClientEvidences(clientId: string | null) {
  const { user } = useAuth();
  const [evidences, setEvidences] = useState<ClientEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvidences = useCallback(async () => {
    if (!clientId || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_evidences")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEvidences((data as ClientEvidence[]) || []);
    } catch (err) {
      console.error("Error fetching evidences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, user]);

  useEffect(() => {
    fetchEvidences();
  }, [fetchEvidences]);

  const uploadEvidence = async (
    file: File,
    type: string,
    title: string,
    notes?: string
  ) => {
    if (!clientId || !user) return;
    const filePath = `${user.id}/${clientId}/${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("evidences")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("evidences")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("client_evidences")
        .insert({
          user_id: user.id,
          client_id: clientId,
          type,
          title,
          file_url: urlData.publicUrl,
          notes: notes || null,
        } as any);
      if (insertError) throw insertError;

      toast.success("Evidência enviada com sucesso!");
      fetchEvidences();
    } catch (err: any) {
      console.error("Error uploading evidence:", err);
      toast.error("Erro ao enviar evidência");
    }
  };

  const deleteEvidence = async (evidence: ClientEvidence) => {
    try {
      // Delete file from storage
      if (evidence.file_url) {
        const parts = evidence.file_url.split("/evidences/");
        if (parts.length >= 2) {
          await supabase.storage.from("evidences").remove([parts[1]]);
        }
      }
      const { error } = await supabase
        .from("client_evidences")
        .delete()
        .eq("id", evidence.id);
      if (error) throw error;
      toast.success("Evidência removida");
      fetchEvidences();
    } catch (err) {
      console.error("Error deleting evidence:", err);
      toast.error("Erro ao remover evidência");
    }
  };

  const getSignedUrl = async (fileUrl: string): Promise<string | null> => {
    const parts = fileUrl.split("/evidences/");
    if (parts.length < 2) return fileUrl;
    const { data, error } = await supabase.storage
      .from("evidences")
      .createSignedUrl(parts[1], 3600);
    if (error) return null;
    return data.signedUrl;
  };

  return { evidences, isLoading, uploadEvidence, deleteEvidence, getSignedUrl, refetch: fetchEvidences };
}
