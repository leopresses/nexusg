import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
  Shield,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  X,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { useAuth } from "@/hooks/useAuth";
import { useClientEvidences, EVIDENCE_TYPES } from "@/hooks/useClientEvidences";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";

import { generateRecoveryPdf } from "@/lib/recoveryPdfGenerator";
import { downloadPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const CHECKLIST_STEPS = [
  "Abrir a ferramenta de contestação do Google",
  "Confirmar que está na conta correta do Google",
  "Selecionar o perfil da empresa restrito",
  "Verificar o motivo e a política violada",
  "Enviar a contestação pelo formulário",
  "Se solicitado, anexar evidências (PDF gerado aqui)",
] as const;

const GOOGLE_APPEAL_URL =
  "https://support.google.com/business/workflow/13569690?sjid=8273479830695779318-SA&visit_id=639076383517998129-3093210050&p=manage_appeals&rd=1";

function safeClientAvatarKey(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  const parts = avatarUrl.split("/client-avatars/");
  if (parts.length < 2) return null;
  return parts[1];
}

export default function Recovery() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const preselectedClientId = searchParams.get("client");

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(preselectedClientId);

  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(() => new Array(CHECKLIST_STEPS.length).fill(false));

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

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync selection if param changes (ex.: veio de outra página com ?client=)
  useEffect(() => {
    if (!preselectedClientId) return;
    setSelectedClientId(preselectedClientId);
  }, [preselectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setIsLoadingClients(true);
    try {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      if (!isMountedRef.current) return;
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Erro ao carregar clientes");
    } finally {
      if (isMountedRef.current) setIsLoadingClients(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const toggleStep = useCallback((index: number) => {
    setCheckedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const resetUploadForm = useCallback(() => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadNotes("");
    setUploadType("outros");
  }, []);

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    if (!selectedClientId) {
      toast.error("Selecione um cliente antes de enviar evidências.");
      return;
    }

    if (!uploadFile || !uploadTitle.trim()) {
      toast.error("Preencha o título e selecione um arquivo.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadEvidence(uploadFile, uploadType, uploadTitle.trim(), uploadNotes.trim() || undefined);
      toast.success("Evidência enviada com sucesso!");
      resetUploadForm();
    } catch (err) {
      console.error("Error uploading evidence:", err);
      toast.error("Erro ao enviar evidência");
    } finally {
      setIsUploading(false);
    }
  }, [
    isUploading,
    selectedClientId,
    uploadFile,
    uploadTitle,
    uploadNotes,
    uploadType,
    uploadEvidence,
    resetUploadForm,
  ]);

  const contestationText = useMemo(() => {
    if (!selectedClient) return "";
    const snap = (selectedClient as any).place_snapshot as any;
    const phone = snap?.formatted_phone_number || "";
    return `Olá, estou solicitando revisão do Perfil da Empresa: ${selectedClient.name}.\nEndereço: ${
      selectedClient.address || "Não informado"
    }.\n${phone ? `Telefone: ${phone}.\n` : ""}Este negócio é legítimo e opera no local indicado.\nAnexo evidências documentais (registro/licença/contas/fotos) que comprovam a existência e regularidade do estabelecimento.\nSolicito a gentileza de reavaliar a restrição aplicada ao perfil.`;
  }, [selectedClient]);

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(contestationText);
      toast.success("Texto copiado!");
    } catch {
      toast.error("Não foi possível copiar. Tente copiar manualmente.");
    }
  }, [contestationText]);

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente.");
      return;
    }

    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const evidencesWithUrls = await Promise.all(
        evidences.map(async (ev) => ({
          evidence: ev,
          signedUrl: ev.file_url ? await getSignedUrl(ev.file_url) : null,
        })),
      );

      let avatarSignedUrl: string | null = null;
      const avatarKey = safeClientAvatarKey((selectedClient as any).avatar_url);
      if (avatarKey) {
        const { data } = await supabase.storage.from("client-avatars").createSignedUrl(avatarKey, 3600);
        avatarSignedUrl = data?.signedUrl || null;
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
  }, [selectedClient, isGeneratingPdf, evidences, getSignedUrl, brandSettings]);

  const shareWhatsApp = useCallback(() => {
    if (!selectedClient) {
      toast.error("Selecione um cliente.");
      return;
    }
    const text = encodeURIComponent(
      `🚨 Recuperação Google Business — ${selectedClient.name}\n\nBaixe o Pacote de Evidências e anexe no formulário de contestação do Google.\n\nLink da ferramenta: ${GOOGLE_APPEAL_URL}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [selectedClient]);

  const deleteEvidenceSafe = useCallback(
    async (evidenceId: string) => {
      try {
        await deleteEvidence(evidenceId);
        toast.success("Evidência removida.");
      } catch (err) {
        console.error("Error deleting evidence:", err);
        toast.error("Erro ao remover evidência");
      }
    },
    [deleteEvidence],
  );

  const checkedCount = useMemo(() => checkedSteps.filter(Boolean).length, [checkedSteps]);

  return (
    <AppLayout
      title="Central de Recuperação"
      subtitle="Google Business Profile — Contestação e Evidências"
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          onClick={openTutorial}
          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
          title="Ver tutorial"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6 relative">
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-0 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm">Central de Recuperação</h3>
                </div>
                <button
                  onClick={closeTutorial}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                  aria-label="Fechar tutorial"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-blue-50">
                <p>Recupere perfis restringidos do Google:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span>
                    <span>Siga o checklist passo a passo para contestar.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span>
                    <span>Envie evidências (alvarás, fotos, documentos).</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span>
                    <span>Gere o PDF de recuperação e envie ao Google.</span>
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
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-slate-900">Atenção</h2>
                <Badge className="bg-red-600 text-white">Urgente</Badge>
              </div>
              <p className="text-sm text-slate-700">
                Esta página ajuda a organizar evidências e gerar um PDF para contestação do Google Business Profile. Não
                garante aprovação — mas aumenta muito as chances.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl bg-white border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => window.open(GOOGLE_APPEAL_URL, "_blank")}
            >
              Abrir contestação <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Client selector */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">1) Selecione o cliente</h3>
              <p className="text-sm text-slate-600">Escolha o perfil que está com restrição no Google.</p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={fetchClients} disabled={isLoadingClients}>
              {isLoadingClients ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Atualizar lista
            </Button>
          </div>

          <div className="mt-4">
            <Select value={selectedClientId ?? ""} onValueChange={(v) => setSelectedClientId(v || null)}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder={isLoadingClients ? "Carregando clientes..." : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">2) Checklist de contestação</h3>
              <p className="text-sm text-slate-600">
                Marque o que você já fez. Progresso: {checkedCount}/{CHECKLIST_STEPS.length}
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => window.open(GOOGLE_APPEAL_URL, "_blank")}
            >
              Abrir link do Google <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {CHECKLIST_STEPS.map((step, idx) => {
              const checked = checkedSteps[idx];
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left"
                >
                  <div className="mt-0.5">
                    {checked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{step}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text for contestation */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">3) Texto de contestação (copiar e colar)</h3>
              <p className="text-sm text-slate-600">Você pode adaptar o texto antes de enviar.</p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={copyText} disabled={!contestationText}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>

          <div className="mt-4">
            <Textarea
              value={contestationText}
              readOnly
              className="min-h-[160px] rounded-xl bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Evidences */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">4) Evidências</h3>
              <p className="text-sm text-slate-600">
                Envie documentos e fotos. Depois gere um PDF para anexar na contestação.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" className="rounded-xl" onClick={shareWhatsApp} disabled={!selectedClient}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar no WhatsApp
              </Button>

              <Button
                onClick={handleGeneratePdf}
                className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
                disabled={!selectedClient || isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Gerar PDF
              </Button>
            </div>
          </div>

          {/* Upload form */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label className="text-slate-700">Tipo</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 mt-2">
                  <SelectValue placeholder="Selecione" />
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

            <div className="md:col-span-2">
              <Label className="text-slate-700">Título</Label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Ex.: Alvará de funcionamento"
                className="h-12 rounded-xl bg-white border-slate-200 mt-2"
              />
            </div>

            <div className="md:col-span-3">
              <Label className="text-slate-700">Observações (opcional)</Label>
              <Textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Qualquer detalhe que ajude na análise…"
                className="rounded-xl bg-white border-slate-200 mt-2 min-h-[90px]"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-slate-700">Arquivo</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="h-12 rounded-xl bg-white border-slate-200"
                />
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadTitle.trim() || isUploading || !selectedClientId}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button
                variant="ghost"
                className="h-12 rounded-xl text-slate-600 hover:bg-slate-100"
                onClick={resetUploadForm}
                disabled={isUploading}
              >
                Limpar
              </Button>
            </div>
          </div>

          {/* Evidence list */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <FileUp className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">Arquivos enviados</span>
              {(isLoadingEvidences || isLoadingClients) && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            {evidences.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 bg-slate-50">
                Nenhuma evidência enviada ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 truncate">{ev.title}</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Tag className="h-3 w-3 mr-1" />
                          {ev.type}
                        </Badge>
                      </div>
                      {ev.notes && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{ev.notes}</p>}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(ev.created_at).toLocaleString()}</span>
                        <CalendarDays className="h-3 w-3 ml-2" />
                        <span>Cliente: {selectedClient?.name ?? "-"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={async () => {
                          if (!ev.file_url) return;
                          const url = await getSignedUrl(ev.file_url);
                          if (url) window.open(url, "_blank");
                          else toast.error("Não foi possível gerar o link do arquivo.");
                        }}
                        disabled={!ev.file_url}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-xl text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => deleteEvidenceSafe(ev.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex gap-3">
            <Info className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 mb-1">Dica</div>
              <p>
                Priorize: fotos da fachada, fotos internas, placas, contas de consumo, alvará/licença e documentos com
                nome/endereço do negócio.
              </p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-700 mt-0.5" />
            <div className="text-sm text-amber-900">Você precisa estar logado para carregar clientes e evidências.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
