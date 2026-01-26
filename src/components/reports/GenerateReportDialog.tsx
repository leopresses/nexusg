import { useState, useEffect } from 'react';
import { FileText, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { generateClientReport, downloadPdf, type ReportData, type ClientData, type TaskData } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (report: { id: string; name: string; createdAt: Date; type: string }) => void;
}

type PeriodType = '7days' | '30days' | '90days' | 'custom';

export function GenerateReportDialog({ open, onOpenChange, onReportGenerated }: GenerateReportDialogProps) {
  const { user } = useAuth();
  const { brandSettings } = useBrandSettings();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingClients, setIsFetchingClients] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchClients();
    }
  }, [open, user]);

  const fetchClients = async () => {
    setIsFetchingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, business_type, address, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingClients(false);
    }
  };

  const getPeriodDates = (periodType: PeriodType): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    
    switch (periodType) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        // Fallback to 30 days if custom dates not set
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return { start, end };
  };

  const handleGenerate = async () => {
    if (!selectedClientId) {
      toast({
        title: 'Selecione um cliente',
        description: 'Você precisa selecionar um cliente para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      toast({
        title: 'Selecione as datas',
        description: 'Você precisa selecionar a data inicial e final para o período personalizado.',
        variant: 'destructive',
      });
      return;
    }

    if (period === 'custom' && customStartDate && customEndDate && customStartDate > customEndDate) {
      toast({
        title: 'Datas inválidas',
        description: 'A data inicial não pode ser maior que a data final.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch client data
      const selectedClient = clients.find((c) => c.id === selectedClientId);
      if (!selectedClient) throw new Error('Client not found');

      const periodDates = getPeriodDates(period);

      // Fetch tasks for this client within the period
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, completed_at, client_id')
        .eq('client_id', selectedClientId)
        .gte('created_at', periodDates.start.toISOString())
        .lte('created_at', periodDates.end.toISOString())
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const tasks: TaskData[] = (tasksData || []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as 'pending' | 'in_progress' | 'completed',
        completed_at: t.completed_at,
        client_id: t.client_id,
      }));

      // Calculate metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
      const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const reportData: ReportData = {
        client: selectedClient,
        tasks,
        period: periodDates,
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          completionRate,
        },
      };

      // Generate PDF
      const pdf = await generateClientReport(brandSettings, reportData);
      
      // Download PDF
      const filename = `relatorio-${selectedClient.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPdf(pdf, filename);

      // Notify success
      const newReport = {
        id: crypto.randomUUID(),
        name: `Relatório - ${selectedClient.name}`,
        createdAt: new Date(),
        type: 'performance',
      };
      
      onReportGenerated(newReport);
      
      toast({
        title: 'Relatório gerado!',
        description: `O relatório de ${selectedClient.name} foi baixado com sucesso.`,
      });

      onOpenChange(false);
      setSelectedClientId('');
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Novo Relatório
          </DialogTitle>
          <DialogDescription>
            Selecione o cliente e o período para gerar um relatório PDF personalizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={isFetchingClients}
            >
              <SelectTrigger id="client" className="bg-secondary border-border">
                <SelectValue placeholder={isFetchingClients ? 'Carregando...' : 'Selecione um cliente'} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger id="period" className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-secondary border-border",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-secondary border-border",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading || !selectedClientId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
