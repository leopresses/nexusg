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
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientEvidences, EVIDENCE_TYPES } from "@/hooks/useClientEvidences";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { generateRecoveryPdf } from "@/lib/recoveryPdfGenerator";
import { downloadPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const CHECKLIST_STEPS = [
  "Abrir a ferramenta de contestação do Google",
  "Confirmar que está na conta correta do Google",
  "Selecionar o perfil da empresa restrito",
  "Verificar o motivo e a política violada",
  "Enviar a contestação pelo formulário",
  "Se solicitado, anexar evidências (PDF gerado aqui)",
];

const GOOGLE_APPEAL_URL = "https://support.google.com/business/troubleshooter/2690467";

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
  const { evidences, isLoading: isLoadingEvidences, uploadEvidence, deleteEvidence, getSignedUrl } =
    useClientEvidences(selectedClientId);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .order("name");
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
    return `Olá, estou solicitando revisão do Perfil da Empresa: ${selectedClient.name}.\nEndereço: ${selectedClient.address || "Não informado"}.\n${phone ? `Telefone: ${phone}.\n` : ""}Este negócio é legítimo e opera no local indicado.\nAnexo evidências documentais (registro/licença/contas/fotos) que comprovam a existência e regularidade do estabelecimento.\nSolicito a gentileza de reavaliar a restrição aplicada ao perfil.`;
  }, [selectedClient]);

  const copyText = () => {
    navigator.clipboard.writeText(contestationText);
    toast.success("Texto copiado!");
  };

  const handleGeneratePdf = async () => {
    if (!selectedClient) return;
    setIsGeneratingPdf(true);
    try {
      // Get signed URLs for all evidences
      const evidencesWithUrls = await Promise.all(
        evidences.map(async (ev) => ({
          evidence: ev,
          signedUrl: ev.file_url ? await getSignedUrl(ev.file_url) : null,
        }))
      );

      // Get client avatar signed URL
      let avatarSignedUrl: string | null = null;
      if ((selectedClient as any).avatar_url) {
        const parts = ((selectedClient as any).avatar_url as string).split("/client-avatars/");
        if (parts.length >= 2) {
          const { data } = await supabase.storage
            .from("client-avatars")
            .createSignedUrl(parts[1], 3600);
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
      `🚨 Recuperação Google Business — ${selectedClient?.name}\n\nBaixe o Pacote de Evidências e anexe no formulário de contestação do Google.\n\nLink da ferramenta: ${GOOGLE_APPEAL_URL}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <AppLayout
      title="Central de Recuperação"
      subtitle="Google Business Profile — Contestação e Evidências"
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-50 border border-red-200 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-red-800">Modo Emergência — 60 minutos</h3>
                <Badge className="bg-red-600 text-white text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> URGENTE
                </Badge>
              </div>
              <p className="text-sm text-red-700">
                A empresa pode ficar <strong>invisível para consumidores</strong> enquanto o perfil estiver restrito. 
                <strong> Não crie um novo perfil</strong> enquanto a contestação estiver em análise.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info disclaimer */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs text-blue-700">
            A contestação é feita diretamente no Google. O Nexus apenas organiza e gera o pacote de evidências.
          </span>
        </div>

        {/* Client Selector */}
        <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 mb-3">Selecionar Cliente</h3>
          {isLoadingClients ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <Select
              value={selectedClientId || ""}
              onValueChange={(v) => setSelectedClientId(v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedClient && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Checklist */}
              <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Checklist de Contestação
                </h3>
                <ul className="space-y-3">
                  {CHECKLIST_STEPS.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => toggleStep(i)}
                    >
                      {checkedSteps[i] ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          checkedSteps[i] ? "line-through text-slate-400" : "text-slate-700"
                        }`}
                      >
                        <span className="font-bold text-slate-500 mr-1">{i + 1}.</span>
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
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Ferramenta do Google
                  </Button>
                </div>
              </div>

              {/* Contestation Text */}
              <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-3">Texto de Contestação</h3>
                <Textarea
                  value={contestationText}
                  readOnly
                  className="min-h-[120px] rounded-xl text-sm !bg-slate-50"
                />
                <Button onClick={copyText} variant="outline" className="mt-3 rounded-xl">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Texto
                </Button>
              </div>

              {/* Upload Evidences */}
              <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-blue-600" />
                  Enviar Evidências
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
                    <Select value={uploadType} onValueChange={setUploadType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVIDENCE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Título</label>
                    <Input
                      placeholder="Ex: Alvará de Funcionamento"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Observações (opcional)
                  </label>
                  <Textarea
                    placeholder="Notas adicionais..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="rounded-xl min-h-[60px]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 truncate">
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>

              {/* Evidences List */}
              <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-4">
                  Evidências Anexadas ({evidences.length})
                </h3>

                {isLoadingEvidences ? (
                  <div className="flex items-center gap-2 text-slate-500 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : evidences.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4">Nenhuma evidência ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {EVIDENCE_TYPES.find((t) => t.value === ev.type)?.label || ev.type}
                            {ev.notes && ` • ${ev.notes}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex-shrink-0"
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
              <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-4">Gerar Pacote de Recuperação</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="rounded-xl bg-red-600 hover:bg-red-700"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={shareWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Compartilhar WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => window.open(GOOGLE_APPEAL_URL, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
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
