// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BrandSettings = {
  id?: string;
  user_id?: string;
  business_name?: string | null;
  support_whatsapp?: string | null;
  website?: string | null;
  primary_color?: string | null;
  logo_url?: string | null;
  report_footer_text?: string | null;
  enable_sounds?: boolean | null;
  updated_at?: string | null;
};

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<BrandSettings>({
    business_name: "",
    support_whatsapp: "",
    website: "",
    primary_color: "#2563EB",
    logo_url: "",
    report_footer_text: "Relatório gerado por Gestão Nexus",
    enable_sounds: true,
  });

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.from("brand_settings").select("*").eq("user_id", user.id).maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: (data as any).id,
          user_id: (data as any).user_id,
          business_name: (data as any).business_name ?? "",
          support_whatsapp: (data as any).support_whatsapp ?? "",
          website: (data as any).website ?? "",
          primary_color: (data as any).primary_color ?? "#2563EB",
          logo_url: (data as any).logo_url ?? "",
          report_footer_text: (data as any).report_footer_text ?? "Relatório gerado por Gestão Nexus",
          enable_sounds: (data as any).enable_sounds ?? true,
          updated_at: (data as any).updated_at,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUploadLogo = async (file: File) => {
    try {
      setIsUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para enviar o logo");
        return;
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("brand-logos").upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("brand-logos").getPublicUrl(path);

      setSettings((prev) => ({ ...prev, logo_url: publicUrl.publicUrl }));
      toast.success("Logo enviado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para salvar");
        return;
      }

      const payload: any = {
        user_id: user.id,
        business_name: settings.business_name || null,
        support_whatsapp: settings.support_whatsapp || null,
        website: settings.website || null,
        primary_color: settings.primary_color || "#2563EB",
        logo_url: settings.logo_url || null,
        report_footer_text: settings.report_footer_text || null,
        enable_sounds: !!settings.enable_sounds,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("brand_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase.from("brand_settings").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_settings").insert(payload);
        if (error) throw error;
      }

      toast.success("Configurações salvas!");
      fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  // ======= Preview helpers =======
  const companyName = (settings.business_name || "Gestão Nexus").toString().trim() || "Gestão Nexus";
  const primaryColor = (settings.primary_color || "#2563EB").toString();
  // Header/rodapé do preview em azul fixo (igual seu tema), mas você pode trocar para primaryColor se quiser
  const secondaryColor = "#1D4ED8"; // blue-700-ish
  const footerText = (settings.report_footer_text || "Relatório gerado por Gestão Nexus").toString();
  const initialLetter = companyName.charAt(0).toUpperCase() || "G";

  if (isLoading) {
    return (
      <AppLayout title="Configurações" subtitle="Personalize sua experiência e marca">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 !bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando configurações…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configurações" subtitle="Personalize sua experiência e marca">
      <div className="space-y-6">
        {/* Brand Card */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Identidade da Marca</h2>
              <p className="text-sm text-slate-600">Essas informações aparecem nos relatórios em PDF.</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo */}
            <div className="lg:col-span-1">
              <Label className="text-slate-700">Logo</Label>
              <div className="mt-2 rounded-2xl border border-slate-200 !bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl border border-slate-200 !bg-white flex items-center justify-center overflow-hidden">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Envie seu logo</div>
                    <div className="text-xs text-slate-600">PNG/JPG recomendado</div>

                    <div className="mt-3">
                      <label className="inline-flex">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadLogo(file);
                          }}
                        />
                        <span
                          className={`inline-flex items-center justify-center h-9 px-4 rounded-xl border border-slate-200 !bg-white text-slate-700 hover:!bg-slate-100 cursor-pointer ${
                            isUploading ? "opacity-60 pointer-events-none" : ""
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando…
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Escolher arquivo
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {settings.logo_url && <div className="mt-3 text-xs text-slate-500 break-all">{settings.logo_url}</div>}
              </div>
            </div>

            {/* Fields */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Nome da Empresa</Label>
                <Input
                  value={settings.business_name || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, business_name: e.target.value }))}
                  placeholder="Ex: Agência XYZ"
                  className="h-10 rounded-xl !bg-white !text-slate-900 border border-slate-200 shadow-sm
                  focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">WhatsApp de Suporte</Label>
                <Input
                  value={settings.support_whatsapp || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, support_whatsapp: e.target.value }))}
                  placeholder="Ex: +55 11 99999-9999"
                  className="h-10 rounded-xl !bg-white !text-slate-900 border border-slate-200 shadow-sm
                  focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Website</Label>
                <Input
                  value={settings.website || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, website: e.target.value }))}
                  placeholder="Ex: https://minhaagencia.com"
                  className="h-10 rounded-xl !bg-white !text-slate-900 border border-slate-200 shadow-sm
                  focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Cor Primária</Label>
                <Input
                  type="color"
                  value={settings.primary_color || "#2563EB"}
                  onChange={(e) => setSettings((p) => ({ ...p, primary_color: e.target.value }))}
                  className="h-10 rounded-xl !bg-white border border-slate-200 shadow-sm p-1"
                />
                <div className="text-xs text-slate-500">Usada em botões e detalhes do PDF.</div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">Texto do Rodapé do Relatório</Label>
                <Textarea
                  value={settings.report_footer_text || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, report_footer_text: e.target.value }))}
                  placeholder="Ex: Relatório gerado por Gestão Nexus"
                  className="min-h-[90px] rounded-2xl !bg-white !text-slate-900 border border-slate-200 shadow-sm
                  focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* PDF Preview (RESTORED) */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pré-visualização do Relatório</h2>
              <p className="text-sm text-slate-600">Esta é uma prévia de como seu relatório PDF será exibido.</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="p-5" style={{ backgroundColor: secondaryColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="h-10 w-10 rounded-xl object-contain bg-white/10 p-1"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="text-white font-bold">{initialLetter}</span>
                    </div>
                  )}

                  <span className="font-bold text-white">{companyName}</span>
                </div>

                <span className="text-white/70 text-sm">Relatório Semanal</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 bg-white">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Pizzaria Roma</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { value: 456, label: "Visualizações" },
                  { value: 23, label: "Chamadas" },
                  { value: 89, label: "Rotas" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="p-4 rounded-2xl text-center border border-slate-200"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {kpi.value}
                    </div>
                    <div className="text-xs text-slate-500">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">Tarefas Concluídas</h3>
                <div className="space-y-1">
                  {["Postar 3 fotos", "Responder avaliações", "Atualizar horário"].map((task, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div
                        className="h-4 w-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-4 text-center text-sm"
              style={{
                backgroundColor: secondaryColor,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {footerText}
            </div>
          </div>
        </motion.div>

        {/* Preferences Card */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h2 className="text-lg font-semibold text-slate-900">Preferências</h2>
          <p className="text-sm text-slate-600 mb-6">Ajuste comportamentos do sistema.</p>

          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl !bg-slate-50 border border-slate-200">
            <div>
              <div className="font-medium text-slate-900">Sons de Feedback</div>
              <div className="text-sm text-slate-600">Tocar som ao concluir tarefas e alterações de status.</div>
            </div>
            <Switch
              checked={!!settings.enable_sounds}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, enable_sounds: v }))}
            />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
