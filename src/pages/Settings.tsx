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
  company_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
  report_footer?: string | null;
  updated_at?: string | null;
};

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<BrandSettings>({
    company_name: "",
    primary_color: "#2563EB",
    logo_url: "",
    report_footer: "Relatório gerado por Gestão Nexus",
  });

  // ÚNICA ALTERAÇÃO: Estilo do balão azul aplicado globalmente nesta página
  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

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
          id: data.id,
          user_id: data.user_id,
          company_name: data.company_name ?? "",
          primary_color: data.primary_color ?? "#2563EB",
          secondary_color: data.secondary_color ?? "#1D4ED8",
          accent_color: data.accent_color ?? "#06b6d4",
          logo_url: data.logo_url ?? "",
          report_footer: data.report_footer ?? "Relatório gerado por Gestão Nexus",
          updated_at: data.updated_at,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar configurações", toastStyle);
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
        toast.error("Faça login para enviar o logo", toastStyle);
        return;
      }
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("brand-logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("brand-logos").getPublicUrl(path);
      setSettings((prev) => ({ ...prev, logo_url: publicUrl.publicUrl }));
      toast.success("Logo enviado com sucesso!", toastStyle);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar logo", toastStyle);
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
        toast.error("Faça login para salvar", toastStyle);
        return;
      }
      const payload: any = {
        user_id: user.id,
        company_name: settings.company_name || null,
        primary_color: settings.primary_color || "#2563EB",
        secondary_color: settings.secondary_color || "#1D4ED8",
        accent_color: settings.accent_color || "#06b6d4",
        logo_url: settings.logo_url || null,
        report_footer: settings.report_footer || null,
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
      toast.success("Configurações salvas!", toastStyle);
      fetchSettings();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações", toastStyle);
    } finally {
      setIsSaving(false);
    }
  };

  const companyName = (settings.company_name || "Gestão Nexus").toString().trim() || "Gestão Nexus";
  const primaryColor = (settings.primary_color || "#2563EB").toString();
  const secondaryColor = (settings.secondary_color || "#1D4ED8").toString();
  const footerText = (settings.report_footer || "Relatório gerado por Gestão Nexus").toString();
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
    <AppLayout title="Configurações" subtitle="Personalize sua identidade e preferências">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Identidade da Marca</h2>
                <p className="text-sm text-slate-600">Altere os dados e veja ao lado o resultado.</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg shadow-blue-200"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Logo da Empresa</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
                  <div className="h-20 w-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Recomendado: Quadrado, fundo transparente.</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLogo(file);
                        }}
                        disabled={isUploading}
                      />
                      <div className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1" />
                        )}
                        Trocar Logo
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Nome no Relatório</Label>
                  <Input
                    value={settings.company_name || ""}
                    onChange={(e) => setSettings((p) => ({ ...p, company_name: e.target.value }))}
                    className="!bg-white !text-slate-900 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color || "#2563EB"}
                      onChange={(e) => setSettings((p) => ({ ...p, primary_color: e.target.value }))}
                      className="w-12 h-10 p-1 !bg-white border-slate-200"
                    />
                    <Input
                      value={settings.primary_color || ""}
                      onChange={(e) => setSettings((p) => ({ ...p, primary_color: e.target.value }))}
                      className="flex-1 !bg-white !text-slate-900"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Texto do Rodapé</Label>
                <Textarea
                  value={settings.report_footer || ""}
                  onChange={(e) => setSettings((p) => ({ ...p, report_footer: e.target.value }))}
                  className="min-h-[80px] !bg-white !text-slate-900 border-slate-200"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sistema</h2>
            <p className="text-sm text-slate-500">Preferências do sistema podem ser configuradas em breve.</p>
          </motion.div>
        </div>

        <div className="lg:col-span-2 sticky top-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-semibold">Prévia em Tempo Real</h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white scale-[0.95] origin-top">
              <div className="p-4" style={{ backgroundColor: secondaryColor }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} className="h-8 w-8 rounded-lg object-contain bg-white/20 p-1" />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span className="text-white text-xs font-bold">{initialLetter}</span>
                      </div>
                    )}
                    <span className="font-bold text-white text-sm">{companyName}</span>
                  </div>
                  <span className="text-white/60 text-[10px] uppercase tracking-wider">Relatório</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="h-4 w-1/3 bg-slate-100 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-100 text-center"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <div className="text-lg font-bold" style={{ color: primaryColor }}>
                        00
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase">Métrica</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-1/4 bg-slate-100 rounded mb-3" />
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                      <div className="h-2 w-full bg-slate-50 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="p-3 text-center text-[10px]"
                style={{ backgroundColor: secondaryColor, color: "rgba(255,255,255,0.7)" }}
              >
                {footerText}
              </div>
            </div>
            <p className="text-center text-xs text-slate-400">
              O layout acima é uma representação simplificada do PDF.
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
