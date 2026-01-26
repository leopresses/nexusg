import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Download,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";

interface Report {
  id: string;
  name: string;
  createdAt: Date;
  type: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReportGenerated = (report: Report) => {
    setReports((prev) => [report, ...prev]);
  };

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
                Os relatórios são exportados em PDF com a identidade visual 
                personalizada da sua marca (configurável em Configurações).
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
                          {report.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Baixado
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <GenerateReportDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onReportGenerated={handleReportGenerated}
      />
    </AppLayout>
  );
}
