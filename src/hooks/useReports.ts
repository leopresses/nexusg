import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Report {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  period_start: string;
  period_end: string;
  file_url: string | null;
  metrics: any;
  created_at: string;
  client?: {
    name: string;
  } | null;
}

export function useReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estilo padrão para os balões de notificação do Gestão Nexus
  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  const fetchReports = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
          *,
          client:clients(name)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Erro ao carregar relatórios", toastStyle);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const saveReport = async (reportData: {
    clientId: string;
    name: string;
    periodStart: Date;
    periodEnd: Date;
    metrics: Record<string, any>;
    fileUrl?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          client_id: reportData.clientId,
          name: reportData.name,
          period_start: reportData.periodStart.toISOString(),
          period_end: reportData.periodEnd.toISOString(),
          metrics: reportData.metrics,
          file_url: reportData.fileUrl || null,
        })
        .select(
          `
          *,
          client:clients(name)
        `,
        )
        .single();

      if (error) throw error;

      if (data) {
        setReports((prev) => [data as Report, ...prev]);
        toast.success("Relatório salvo com sucesso!", toastStyle);
      }

      return data;
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Erro ao salvar relatório", toastStyle);
      return null;
    }
  };

  const updateReportFileUrl = async (reportId: string, fileUrl: string) => {
    try {
      const { error } = await supabase.from("reports").update({ file_url: fileUrl }).eq("id", reportId);

      if (error) throw error;

      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, file_url: fileUrl } : r)));

      return true;
    } catch (error) {
      console.error("Error updating report file URL:", error);
      return false;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("id", reportId);

      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== reportId));

      // LINHA 129: Ajustada para o balão azul de alto contraste
      toast.success("Relatório excluído com sucesso", toastStyle);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erro ao excluir relatório", toastStyle);
    }
  };

  return {
    reports,
    isLoading,
    saveReport,
    updateReportFileUrl,
    deleteReport,
    refetch: fetchReports,
  };
}
