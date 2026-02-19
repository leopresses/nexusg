import { motion, AnimatePresence } from "framer-motion";
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
  HelpCircle,
  X,
  ArrowRight,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";
import { DeleteReportDialog } from "@/components/reports/DeleteReportDialog";
import { useReports, type Report } from "@/hooks/useReports";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/config/plans";
import { toast } from "sonner";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";

export default function Reports() {
  const { reports, isLoading, deleteReport } = useReports();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/reports");

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
        <div className="flex items-center gap-2 relative">
          {/* Botão de Ajuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openTutorial}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Como funciona?"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Botão Principal Azul */}
          <Button onClick={() => setIsDialogOpen(true)} variant="default" className="rounded-xl shadow-md font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Gerar Novo Relatório
          </Button>

          {/* Tutorial Bubble */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <Printer className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Relatórios Profissionais</h3>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-sm text-blue-50">
                  <ul className="space-y-2 list-none">
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        1
                      </span>
                      <span>Clique em "Gerar Novo Relatório" para selecionar um cliente e período.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        2
                      </span>
                      <span>O sistema compila automaticamente tarefas concluídas e métricas.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        3
                      </span>
                      <span>Envie o PDF gerado diretamente via WhatsApp para seu cliente.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeTutorial}
                    className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    Entendi <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Seta do balão */}
                <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    </AppLayout>
  );
}
