import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Share2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";
import { DeleteReportDialog } from "@/components/reports/DeleteReportDialog";
import { useReports, type Report } from "@/hooks/useReports";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/config/plans";
import { toast } from "sonner";
import { useHelpTour } from "@/hooks/useHelpTour";
import { HelpFab } from "@/components/help/HelpFab";
import { HelpModal } from "@/components/help/HelpModal";

const HELP_STEPS = [
  { text: "Clique em \"Gerar Novo Relatório\" para selecionar um cliente e período." },
  { text: "O sistema compila automaticamente as tarefas concluídas e métricas do período." },
  { text: "Baixe o PDF gerado ou envie diretamente via WhatsApp para o cliente." },
  { text: "A identidade visual dos relatórios é configurada em Configurações → Marca." },
];

export default function Reports() {
  const { reports, isLoading, deleteReport } = useReports();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const { isOpen, open, close } = useHelpTour("reports");

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
        <Button onClick={() => setIsDialogOpen(true)} variant="default" className="rounded-xl shadow-md font-bold">
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
              <h3 className="font-bold text-lg mb-1 text-slate-900">Como funciona?</h3>
              <p className="text-slate-600">
                Gere relatórios detalhados sobre o desempenho dos seus clientes. Os relatórios mostram apenas as{" "}
                <strong>tarefas concluídas</strong> e são exportados em PDF com a identidade visual personalizada da sua
                marca (configurável em Configurações).
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
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">Nenhum relatório gerado ainda</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Comece gerando seu primeiro relatório para acompanhar o desempenho dos seus clientes ao longo do tempo.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} variant="default" className="rounded-xl shadow-md font-bold">
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
                      <h4 className="font-bold text-slate-900">{report.name}</h4>
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
                        {report.client && (
                          <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {report.client.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(report)}
                      className="gap-2 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50 font-medium"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(report)}
                      disabled={!report.file_url}
                      className="rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50 disabled:opacity-60 font-medium"
                    >
                      <Download className="h-4 w-4 mr-2 text-blue-600" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(report)}
                      className="rounded-xl text-slate-400 hover:text-red-600 hover:!bg-red-50"
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
      <HelpFab onOpen={open} />
      <HelpModal
        isOpen={isOpen}
        onClose={close}
        title="Gerador de Relatórios"
        subtitle="Crie relatórios PDF profissionais para seus clientes."
        steps={HELP_STEPS}
      />
    </AppLayout>
  );
}
