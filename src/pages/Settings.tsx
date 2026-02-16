// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
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

  // Estilo centralizado para os balões azuis de alto contraste
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

      toast.success("Configurações salvas!", toastStyle);
      fetchSettings();
    } catch (e) {
      toast.error("Erro ao salvar configurações", toastStyle);
    } finally {
      setIsSaving(false);
    }
  };

  const companyName = (settings.business_name || "Gestão Nexus").toString().trim() || "Gestão Nexus";
  const primaryColor = (settings.primary_color || "#2563EB").toString();
  const secondaryColor = "#1D4ED8";
  const footerText = (settings.report_footer_text || "Relatório gerado por Gestão Nexus").toString();
  const initialLetter = companyName.charAt(0).toUpperCase() || "G";

  if (isLoading) {
    return (
      <AppLayout title="Configurações">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configurações" subtitle="Personalize sua experiência e marca">
      {/* Grid Restaurado para Lado a Lado (lg:grid-cols-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LADO ESQUERDO: Configurações */}
        <div className="space-y-6">
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Identidade da Marca</h2>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 font-bold"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={settings.business_name || ""}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                    className="rounded-xl border-slate-200 !bg-white !text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <Input
                    type="color"
                    value={settings.primary_color || "#2563EB"}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="h-10 p-1 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto do Rodapé</Label>
                <Textarea
                  value={settings.report_footer_text || ""}
                  onChange={(e) => setSettings({ ...settings, report_footer_text: e.target.value })}
                  className="rounded-xl border-slate-200 min-h-[90px] !bg-white !text-slate-900"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferências</h2>
            <div className="flex items-center justify-between p-4 rounded-xl !bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-900">Sons de Feedback</span>
              <Switch
                checked={!!settings.enable_sounds}
                onCheckedChange={(v) => setSettings({ ...settings, enable_sounds: v })}
              />
            </div>
          </motion.div>
        </div>

        {/* LADO DIREITO: Prévia em Tempo Real (Sticky) */}
        <div className="lg:sticky lg:top-24">
          <motion.div
            className="rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Header do PDF */}
            <div className="p-6 text-white" style={{ backgroundColor: secondaryColor }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                    {initialLetter}
                  </div>
                  <span className="font-bold text-lg">{companyName}</span>
                </div>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Relatório</span>
              </div>
            </div>

            {/* Corpo do PDF */}
            <div className="p-8 space-y-8 min-h-[400px]">
              <h2
                className="text-2xl font-black text-slate-900 border-b-4 inline-block"
                style={{ borderBottomColor: primaryColor }}
              >
                Pizzaria Roma
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { v: "456", l: "Views" },
                  { v: "23", l: "Call" },
                  { v: "89", l: "Maps" },
                ].map((k) => (
                  <div
                    key={k.l}
                    className="p-5 rounded-2xl text-center border border-slate-100"
                    style={{ backgroundColor: `${primaryColor}08` }}
                  >
                    <div className="text-2xl font-black mb-1" style={{ color: primaryColor }}>
                      {k.v}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Tarefas Concluídas</div>
                {["Postar 3 fotos", "Responder avaliações"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do PDF */}
            <div className="p-4 bg-slate-50 text-center text-[10px] font-bold text-slate-400 border-t border-slate-100 uppercase tracking-widest">
              {footerText}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
