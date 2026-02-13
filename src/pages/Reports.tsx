import { motion } from "framer-motion";
import { FileText, Plus, Download, Calendar, Clock, Trash2, Loader2, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";
import { DeleteReportDialog } from "@/components/reports/DeleteReportDialog";
import { useReports, type Report } from "@/hooks/useReports";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/config/plans";
import { toast } from "sonner";

export default function Reports() {
  const { reports, isLoading, deleteReport } = useReports();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (reportToDelete) {
      await deleteReport(reportToDelete.id);
      setReportToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleShareWhatsApp = (report: Report) => {
    const clientName = report.client?.name || "Cliente";
    const periodStart = new Date(report.period_start).toLocaleDateString("pt-BR");
    const periodEnd = new Date(report.period_end).toLocaleDateString("pt-BR");

    let message =
      `📊 *Relatório de Performance*\n\n` +
      `📌 Cliente: ${clientName}\n` +
      `📅 Período: ${periodStart} - ${periodEnd}\n` +
      `✅ Tarefas concluídas: ${report.metrics?.completedTasks || 0}\n\n`;

    // If we have a PDF URL, include it
    if (report.file_url) {
      message += `📄 Baixar relatório em PDF:\n${report.file_url}\n\n`;
    }

    message += `Relatório gerado por Gestão Nexus`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleDownloadPdf = (report: Report) => {
    if (report.file_url) {
      window.open(report.file_url, "_blank");
    } else {
      toast.error("PDF não disponível. Gere um novo relatório para obter o PDF.");
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Gerador de Relatórios" subtitle="Crie e gerencie relatórios personalizados para seus clientes">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 !bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando relatórios…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Gerador de Relatórios"
      subtitle="Crie e gerencie relatórios personalizados para seus clientes"
      headerActions={
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Gerar Novo Relatório
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Info Section */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl !bg-blue-50 border border-blue-200 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-slate-900">Como funciona?</h3>
              <p className="text-slate-600">
                Gere relatórios detalhados sobre o desempenho dos seus clientes. Os relatórios mostram apenas as{" "}
                <strong>tarefas concluídas</strong> e são exportados em PDF com a identidade visual personalizada da sua
                marca (configurável em Configurações). Você pode compartilhar o PDF diretamente via WhatsApp.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-12 text-center shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="h-20 w-20 rounded-full !bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900">Nenhum relatório gerado ainda</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Comece gerando seu primeiro relatório para acompanhar o desempenho dos seus clientes ao longo do tempo.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Primeiro Relatório
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:!bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl !bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{report.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {report.client && <span className="text-blue-600 font-medium">{report.client.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(report)}
                      className="gap-2 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(report)}
                      disabled={!report.file_url}
                      className="rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50 disabled:opacity-60"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(report)}
                      className="rounded-xl text-slate-500 hover:text-red-600 hover:!bg-slate-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <GenerateReportDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <DeleteReportDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        reportName={reportToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </AppLayout>
  );
}
