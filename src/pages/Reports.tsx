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
    
    let message = `📊 *Relatório de Performance*\n\n` +
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Gerador de Relatórios" 
      subtitle="Crie e gerencie relatórios personalizados para seus clientes"
      headerActions={
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Gerar Novo Relatório
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Info Section */}
        <motion.div 
          className="rounded-xl bg-card border border-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Como funciona?</h3>
              <p className="text-muted-foreground">
                Gere relatórios detalhados sobre o desempenho dos seus clientes. 
                Os relatórios mostram apenas as <strong>tarefas concluídas</strong> e são 
                exportados em PDF com a identidade visual personalizada da sua marca 
                (configurável em Configurações). Você pode compartilhar o PDF diretamente via WhatsApp.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <motion.div 
            className="rounded-xl bg-card border border-border p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum relatório gerado ainda</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece gerando seu primeiro relatório para acompanhar o desempenho 
              dos seus clientes ao longo do tempo.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Primeiro Relatório
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="rounded-xl bg-card border border-border divide-y divide-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {report.client && (
                          <span className="text-primary">{report.client.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShareWhatsApp(report)}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadPdf(report)}
                      disabled={!report.file_url}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(report)}
                      className="text-muted-foreground hover:text-destructive"
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

      <GenerateReportDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />

      <DeleteReportDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        reportName={reportToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </AppLayout>
  );
}
