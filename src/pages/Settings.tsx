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

  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("brand_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          business_name: data.business_name ?? "",
          support_whatsapp: data.support_whatsapp ?? "",
          website: data.website ?? "",
          primary_color: data.primary_color ?? "#2563EB",
          logo_url: data.logo_url ?? "",
          report_footer_text: data.report_footer_text ?? "Relatório gerado por Gestão Nexus",
          enable_sounds: data.enable_sounds ?? true,
        });
      }
    } catch (e) {
      toast.error("Erro ao carregar", toastStyle);
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
      if (!user) return;
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
      if (!user) return;
      const payload = {
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
      const { error } = existing?.id
        ? await supabase.from("brand_settings").update(payload).eq("id", existing.id)
        : await supabase.from("brand_settings").insert(payload);
      if (error) throw error;
      toast.success("Configurações salvas!", toastStyle);
    } catch (e) {
      toast.error("Erro ao salvar", toastStyle);
    } finally {
      setIsSaving(false);
    }
  };

  const companyName = settings.business_name || "Gestão Nexus";
  const primaryColor = settings.primary_color || "#2563EB";
  const footerText = settings.report_footer_text || "Relatório gerado por Gestão Nexus";

  if (isLoading) return <AppLayout title="Configurações">Carregando...</AppLayout>;

  return (
    <AppLayout title="Configurações" subtitle="Personalize sua identidade e preferências">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="space-y-6">
          <motion.div
            className="rounded-3xl !bg-white border border-slate-200 p-8 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Identidade da Marca</h2>
                <p className="text-sm text-slate-500">Altere os dados e veja ao lado o resultado.</p>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="!bg-blue-600 rounded-xl font-bold px-6">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4" />} Salvar
              </Button>
            </div>

            <div className="space-y-6">
              {/* LOGO RESTAURADO */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-bold">Logo da Empresa</Label>
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">Recomendado: Quadrado, fundo transparente.</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUploadLogo(e.target.files[0])}
                        disabled={isUploading}
                      />
                      <span className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 justify-center">
                        <Upload className="h-4 w-4" /> {isUploading ? "Enviando..." : "Trocar Logo"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Nome no Relatório</Label>
                  <Input
                    value={settings.business_name || ""}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                    className="rounded-xl border-slate-200 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color || "#2563EB"}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="h-12 w-14 p-1 rounded-xl cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color || ""}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="rounded-xl border-slate-200 h-12 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Texto do Rodapé</Label>
                <Textarea
                  value={settings.report_footer_text || ""}
                  onChange={(e) => setSettings({ ...settings, report_footer_text: e.target.value })}
                  className="rounded-xl border-slate-200 min-h-[100px] text-slate-600"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* LADO DIREITO: PRÉVIA (STICKY) */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-600">Prévia em Tempo Real</span>
          </div>

          <motion.div
            className="rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-6 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-lg">{companyName}</span>
                </div>
                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Relatório</span>
              </div>
            </div>

            <div className="p-8 space-y-8 min-h-[350px]">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "00", l: "Métrica" },
                  { v: "00", l: "Métrica" },
                  { v: "00", l: "Métrica" },
                ].map((k, i) => (
                  <div key={i} className="p-4 rounded-2xl text-center border border-slate-100 bg-slate-50/50">
                    <div className="text-xl font-black mb-1 text-emerald-500">{k.v}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{k.l}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div className="h-2 w-3/4 bg-slate-50 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div className="h-2 w-1/2 bg-slate-50 rounded-full" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-600 text-center text-[9px] font-bold text-white uppercase tracking-widest">
              {footerText}
            </div>
          </motion.div>
          <p className="mt-4 text-center text-[10px] text-slate-400">
            O layout acima é uma representação simplificada do PDF.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
