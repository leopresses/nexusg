import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  Loader2,
  MessageCircle,
  Shield,
  Trash2,
  Upload,
  Clock,
  Info,
  X,
  HelpCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientEvidences, EVIDENCE_TYPES } from "@/hooks/useClientEvidences";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { generateRecoveryPdf } from "@/lib/recoveryPdfGenerator";
import { downloadPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function Recovery() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { brandSettings } = useBrandSettings();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/recovery");

  const {
    evidences,
    isLoading: isLoadingEvidences,
    uploadEvidence,
    deleteEvidence,
    getSignedUrl,
  } = useClientEvidences(selectedClientId);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  useEffect(() => {
    async function fetchClients() {
      try {
        setIsLoadingClients(true);
        const { data, error } = await supabase.from("clients").select("*").order("name");
        if (error) throw error;
        setClients(data || []);

        // Se vier via querystring ?clientId=...
        const clientIdFromQuery = searchParams.get("clientId");
        if (clientIdFromQuery && (data || []).some((c) => c.id === clientIdFromQuery)) {
          setSelectedClientId(clientIdFromQuery);
        } else if (!selectedClientId && (data || []).length > 0) {
          setSelectedClientId((data || [])[0].id);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
        toast.error("Erro ao carregar clientes");
      } finally {
        setIsLoadingClients(false);
      }
    }

    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedClientId || !selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }

    try {
      setIsGenerating(true);

      // Assina URL do avatar (se existir)
      let avatarSignedUrl: string | null = null;
      if (selectedClient.avatar_url) {
        avatarSignedUrl = await getSignedUrl(selectedClient.avatar_url);
      }

      // place_snapshot pode estar em JSON
      const placeSnapshot = (selectedClient.place_snapshot as any) || null;

      const pdfBlob = await generateRecoveryPdf({
        client: {
          name: selectedClient.name,
          business_type: selectedClient.business_type || "",
          address: selectedClient.address || null,
          avatarSignedUrl,
          placeSnapshot,
        },
        evidences: (evidences || []).map((e) => ({
          evidence: e,
          signedUrl: e.file_url ? null : null,
        })),
        brand: {
          business_name: brandSettings?.business_name || "Gestão Nexus",
          logo_url: brandSettings?.logo_url || null,
        },
      });

      downloadPdf(pdfBlob, `recuperacao-${selectedClient.name}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <AppLayout title="Recuperação de Conta" subtitle="Faça login para acessar esta página">
        <div className="flex items-center justify-center py-20">
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center max-w-md">
            <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Acesso restrito</h2>
            <p className="text-slate-600 mb-5">Você precisa estar logado para gerar relatórios de recuperação.</p>
            <Button className="rounded-xl !bg-blue-600 !text-white" asChild>
              <a href="/login">Ir para login</a>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Recuperação de Conta"
      subtitle="Gere um PDF profissional para solicitar recuperação/reativação de conta"
      headerActions={
        <div className="flex items-center gap-2 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={openTutorial}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleGeneratePdf}
            disabled={!selectedClientId || isGenerating}
            className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Gerar PDF
          </Button>

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
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Como usar</h3>
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
                      <span>Selecione o cliente e anexe evidências (documentos, prints, etc.).</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        2
                      </span>
                      <span>Use “Gerar PDF” para baixar o relatório pronto.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        3
                      </span>
                      <span>Envie ao suporte junto com o link da empresa e informações necessárias.</span>
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

                <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Seleção de cliente */}
        <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Cliente</h3>
          </div>

          {isLoadingClients ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando clientes...
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="" disabled>
                    Selecione um cliente
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient?.google_maps_url && (
                <Button
                  variant="outline"
                  className="h-11 rounded-xl bg-white border-slate-200"
                  onClick={() => window.open(selectedClient.google_maps_url || "", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no Google
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Evidências */}
        <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Evidências</h3>
            </div>

            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {(evidences || []).length} itens
            </Badge>
          </div>

          {!selectedClientId ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-700 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Selecione um cliente</p>
                <p className="text-sm text-slate-600">Depois você poderá anexar documentos e prints.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="md:col-span-1">
                  <select
                    id="evidenceType"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    defaultValue={EVIDENCE_TYPES[0]?.value}
                  >
                    {EVIDENCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="file"
                    className="h-11 rounded-xl !bg-white border border-slate-200 shadow-sm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const typeSelect = document.getElementById("evidenceType") as HTMLSelectElement | null;
                      const typeValue = typeSelect?.value || "outro";

                      await uploadEvidence(file, typeValue);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Lista */}
              {isLoadingEvidences ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando evidências...
                </div>
              ) : (
                <div className="space-y-3">
                  {(evidences || []).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <p className="font-semibold text-slate-900 truncate">{ev.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(ev.created_at).toLocaleString()}
                        </p>
                        {ev.notes && <p className="text-sm text-slate-600 mt-2">{ev.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ev.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-slate-500 hover:bg-slate-100"
                            onClick={() => copyToClipboard(ev.file_url || "")}
                            title="Copiar link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteEvidence(ev)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(evidences || []).length === 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
                      <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="font-semibold text-slate-900">Nenhuma evidência adicionada</p>
                      <p className="text-sm text-slate-600">Envie um arquivo acima para começar.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
