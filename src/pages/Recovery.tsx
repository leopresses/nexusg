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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const CHECKLIST_STEPS = [
  "Abrir a ferramenta de contestação do Google",
  "Confirmar que está na conta correta do Google",
  "Selecionar o perfil da empresa restrito",
  "Verificar o motivo e a política violada",
  "Enviar a contestação pelo formulário",
  "Se solicitado, anexar evidências (PDF gerado aqui)",
];

const GOOGLE_APPEAL_URL =
  "https://support.google.com/business/workflow/13569690?sjid=8273479830695779318-SA&visit_id=639076383517998129-3093210050&p=manage_appeals&rd=1";

export default function Recovery() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("client");

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(preselectedClientId);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(CHECKLIST_STEPS.length).fill(false));

  // Upload form
  const [uploadType, setUploadType] = useState("outros");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { brandSettings } = useBrandSettings();
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
      const { data } = await supabase.from("clients").select("*").order("name");
      setClients(data || []);
      setIsLoadingClients(false);
    }
    if (user) fetchClients();
  }, [user]);

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error("Preencha o título e selecione um arquivo.");
      return;
    }
    setIsUploading(true);
    await uploadEvidence(uploadFile, uploadType, uploadTitle.trim(), uploadNotes.trim() || undefined);
    setUploadFile(null);
    setUploadTitle("");
    setUploadNotes("");
    setUploadType("outros");
    setIsUploading(false);
  };

  const contestationText = useMemo(() => {
    if (!selectedClient) return "";
    const snap = (selectedClient as any).place_snapshot as any;
    const phone = snap?.formatted_phone_number || "";
    return `Olá, estou solicitando revisão do Perfil da Empresa: ${selectedClient.name}.\nEndereço: ${selectedClient.address || "Não informado"}.\n${
      phone ? `Telefone: ${phone}.\n` : ""
    }Este negócio é legítimo e opera no local indicado.\nAnexo evidências documentais (registro/licença/contas/fotos) que comprovam a existência e regularidade do estabelecimento.\nSolicito a gentileza de reavaliar a restrição aplicada ao perfil.`;
  }, [selectedClient]);

  const copyText = () => {
    navigator.clipboard.writeText(contestationText);
    toast.success("Texto copiado!");
  };

  const handleGeneratePdf = async () => {
    if (!selectedClient) return;
    setIsGeneratingPdf(true);
    try {
      const evidencesWithUrls = await Promise.all(
        evidences.map(async (ev) => ({
          evidence: ev,
          signedUrl: ev.file_url ? await getSignedUrl(ev.file_url) : null,
        })),
      );

      let avatarSignedUrl: string | null = null;
      if ((selectedClient as any).avatar_url) {
        const parts = ((selectedClient as any).avatar_url as string).split("/client-avatars/");
        if (parts.length >= 2) {
          const { data } = await supabase.storage.from("client-avatars").createSignedUrl(parts[1], 3600);
          avatarSignedUrl = data?.signedUrl || null;
        }
      }

      const doc = await generateRecoveryPdf({
        client: {
          name: selectedClient.name,
          business_type: selectedClient.business_type,
          address: selectedClient.address,
          avatarSignedUrl,
          placeSnapshot: (selectedClient as any).place_snapshot,
        },
        evidences: evidencesWithUrls,
        agencyName: brandSettings?.companyName || "Gestão Nexus",
      });

      downloadPdf(doc, `recuperacao-${selectedClient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 Recuperação Google Business — ${selectedClient?.name}\n\nBaixe o Pacote de Evidências e anexe no formulário de contestação do Google.\n\nLink da ferramenta: ${GOOGLE_APPEAL_URL}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <AppLayout
      title="Central de Recuperação"
      subtitle="Google Business Profile — Contestação e Evidências"
      headerActions={
        <Button variant="ghost" size="icon" onClick={openTutorial} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50" title="Ver tutorial">
          <HelpCircle className="h-5 w-5" />
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6 relative">
        <AnimatePresence>
          {showTutorial && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-0 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2"><div className="bg-white/20 p-1.5 rounded-lg"><Shield className="h-4 w-4 text-white" /></div><h3 className="font-bold text-sm">Central de Recuperação</h3></div>
                <button onClick={closeTutorial} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3 text-sm text-blue-50">
                <p>Recupere perfis restringidos do Google:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span><span>Siga o checklist passo a passo para contestar.</span></li>
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span><span>Envie evidências (alvarás, fotos, documentos).</span></li>
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span><span>Gere o PDF de recuperação e envie ao Google.</span></li>
                </ul>
              </div>
              <div className="mt-4 flex justify-end"><button onClick={closeTutorial} className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">Entendi <ArrowRight className="h-3 w-3" /></button></div>
              <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-bold text-red-800">Modo Emergência — 60 minutos</h3>
                <Badge className="bg-red-600 text-[10px] text-white">
                  <Clock className="mr-1 h-3 w-3" /> URGENTE
                </Badge>
              </div>
              <p className="text-sm text-red-700">
                A empresa pode ficar <strong>invisível para consumidores</strong> enquanto o perfil estiver restrito.{" "}
                <strong>Não crie um novo perfil</strong> enquanto a contestação estiver em análise.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info disclaimer */}
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <Info className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span className="text-xs text-blue-700">
            A contestação é feita diretamente no Google. O Nexus apenas organiza e gera o pacote de evidências.
          </span>
        </div>

        {/* Client Selector */}
        <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Selecionar Cliente</h3>
          {isLoadingClients ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <Select value={selectedClientId || ""} onValueChange={(v) => setSelectedClientId(v)}>
              <SelectTrigger className="rounded-xl !bg-white border-slate-200 text-slate-900 ring-offset-white">
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>

              {/* ✅ força dropdown branco (antes estava bg-popover escuro) */}
              <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-lg">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="focus:bg-slate-100 focus:text-slate-900">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedClient && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Checklist */}
              <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Checklist de Contestação
                </h3>
                <ul className="space-y-3">
                  {CHECKLIST_STEPS.map((step, i) => (
                    <li key={i} className="group flex cursor-pointer items-center gap-3" onClick={() => toggleStep(i)}>
                      {checkedSteps[i] ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 flex-shrink-0 text-slate-300 group-hover:text-blue-400" />
                      )}
                      <span className={`text-sm ${checkedSteps[i] ? "line-through text-slate-400" : "text-slate-700"}`}>
                        <span className="mr-1 font-bold text-slate-500">{i + 1}.</span>
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => window.open(GOOGLE_APPEAL_URL, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Ferramenta do Google
                  </Button>
                </div>
              </div>

              {/* Contestation Text */}
              <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-slate-900">Texto de Contestação</h3>
                <Textarea value={contestationText} readOnly className="min-h-[120px] rounded-xl text-sm !bg-slate-50" />
                <Button onClick={copyText} variant="outline" className="mt-3 rounded-xl">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Texto
                </Button>
              </div>

              {/* Upload Evidences */}
              <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <FileUp className="h-5 w-5 text-blue-600" />
                  Enviar Evidências
                </h3>

                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
                    <Select value={uploadType} onValueChange={setUploadType}>
                      <SelectTrigger className="rounded-xl !bg-white border-slate-200 text-slate-900 ring-offset-white">
                        <SelectValue />
                      </SelectTrigger>

                      {/* ✅ força dropdown branco */}
                      <SelectContent className="border-slate-200 bg-white text-slate-900 shadow-lg">
                        {EVIDENCE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="focus:bg-slate-100 focus:text-slate-900">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>

                    {/* ✅ força fundo branco no input */}
                    <Input
                      placeholder="Ex: Alvará de Funcionamento"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="rounded-xl !bg-white border-slate-200"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Observações (opcional)</label>

                  {/* ✅ força fundo branco no textarea */}
                  <Textarea
                    placeholder="Notas adicionais..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="min-h-[60px] rounded-xl !bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="truncate text-sm text-slate-600">
                        {uploadFile ? uploadFile.name : "Selecionar arquivo"}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadFile || !uploadTitle.trim()}
                    className="rounded-xl"
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>

              {/* Evidences List */}
              <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">Evidências Anexadas ({evidences.length})</h3>

                {isLoadingEvidences ? (
                  <div className="flex items-center gap-2 py-4 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : evidences.length === 0 ? (
                  <p className="py-4 text-sm text-slate-400">Nenhuma evidência ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{ev.title}</p>
                          <p className="text-xs text-slate-500">
                            {EVIDENCE_TYPES.find((t) => t.value === ev.type)?.label || ev.type}
                            {ev.notes && ` • ${ev.notes}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteEvidence(ev)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">Gerar Pacote de Recuperação</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="rounded-xl bg-red-600 hover:bg-red-700"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Baixar PDF
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={shareWhatsApp}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Compartilhar WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => window.open(GOOGLE_APPEAL_URL, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Ferramenta Google
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
}
