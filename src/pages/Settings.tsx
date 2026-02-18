import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Image as ImageIcon, CheckCircle2, Trash2 } from "lucide-react";
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
  support_whatsapp?: string | null;
  primary_color?: string | null;
  // stored reference URL (not the signed display URL)
  logo_storage_url?: string | null;
  // signed display URL for rendering
  logo_display_url?: string | null;
  report_footer?: string | null;
  enable_sounds?: boolean | null;
};

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  const [settings, setSettings] = useState<BrandSettings>({
    company_name: "",
    support_whatsapp: "",
    primary_color: "#2563EB",
    logo_storage_url: "",
    logo_display_url: "",
    report_footer: "Relatório gerado por Gestão Nexus",
    enable_sounds: true,
  });

  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  const getSignedLogoUrl = async (storedUrl: string): Promise<string | null> => {
    if (!storedUrl) return null;
    // Extract file path from stored URL
    const parts = storedUrl.split('/brand-logos/');
    if (parts.length < 2) return null;
    const filePath = parts[1];
    const { data, error } = await supabase.storage
      .from('brand-logos')
      .createSignedUrl(filePath, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // Fetch brand_settings
      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Fetch sound preference from user_preferences
      const { data: prefData } = await supabase
        .from("user_preferences")
        .select("sound_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      let displayLogoUrl = "";
      if (data?.logo_url) {
        const signed = await getSignedLogoUrl(data.logo_url);
        displayLogoUrl = signed || "";
      }

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          company_name: data.company_name ?? "",
          support_whatsapp: (data as any).support_whatsapp ?? "",
          primary_color: data.primary_color ?? "#2563EB",
          logo_storage_url: data.logo_url ?? "",
          logo_display_url: displayLogoUrl,
          report_footer: data.report_footer ?? "Relatório gerado por Gestão Nexus",
          enable_sounds: prefData?.sound_enabled ?? true,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sessão inválida.", toastStyle); return; }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Formato inválido. Use PNG, JPG, WebP ou SVG.", toastStyle);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 2MB.", toastStyle);
        return;
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;

      // Delete old logos first
      const { data: existingFiles } = await supabase.storage.from("brand-logos").list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from("brand-logos").remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage.from("brand-logos").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      // Build the reference URL to store in DB
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storedUrl = `${baseUrl}/storage/v1/object/public/brand-logos/${path}`;

      // Update DB
      await supabase
        .from("brand_settings")
        .update({ logo_url: storedUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      // Get signed URL for display
      const signedUrl = await getSignedLogoUrl(storedUrl);
      setSettings(prev => ({
        ...prev,
        logo_storage_url: storedUrl,
        logo_display_url: signedUrl || "",
      }));
      toast.success("Logo enviado com sucesso!", toastStyle);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar logo.", toastStyle);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      setIsDeletingLogo(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // List and delete all logo files for this user
      const { data: files } = await supabase.storage.from("brand-logos").list(user.id);
      if (files && files.length > 0) {
        await supabase.storage.from("brand-logos").remove(files.map(f => `${user.id}/${f.name}`));
      }

      // Clear logo_url in DB
      await supabase
        .from("brand_settings")
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      setSettings(prev => ({ ...prev, logo_storage_url: "", logo_display_url: "" }));
      toast.success("Logo removido!", toastStyle);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover logo.", toastStyle);
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sessão expirada", toastStyle); return; }

      // Save brand_settings with correct column names
      const brandPayload = {
        company_name: settings.company_name || null,
        support_whatsapp: settings.support_whatsapp || null,
        primary_color: settings.primary_color || "#2563EB",
        report_footer: settings.report_footer || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("brand_settings")
        .update(brandPayload)
        .eq("user_id", user.id);
      if (error) throw error;

      // Save sound preference in user_preferences
      const { data: existingPref } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPref) {
        await supabase
          .from("user_preferences")
          .update({ sound_enabled: !!settings.enable_sounds, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, sound_enabled: !!settings.enable_sounds });
      }

      toast.success("Configurações salvas!", toastStyle);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações", toastStyle);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview Helpers
  const companyName = (settings.company_name || "Gestão Nexus").toString().trim() || "Gestão Nexus";
  const primaryColor = (settings.primary_color || "#2563EB").toString();
  const secondaryColor = "#1D4ED8";
  const footerText = (settings.report_footer || "Relatório gerado por Gestão Nexus").toString();
  const whatsappText = settings.support_whatsapp?.trim() || "";
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* COLUNA ESQUERDA: Formulários */}
        <div className="space-y-6">
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Identidade da Marca</h2>
                <p className="text-sm text-slate-600">Altere os dados e veja o resultado.</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg shadow-blue-200"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Logo da Empresa</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
                  <div className="h-20 w-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logo_display_url ? (
                      <img src={settings.logo_display_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Recomendado: Quadrado, fundo transparente.</p>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadLogo(file);
                          }}
                          disabled={isUploading}
                        />
                        <div className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Trocar Logo
                        </div>
                      </label>
                      {settings.logo_display_url && (
                        <button
                          onClick={handleDeleteLogo}
                          disabled={isDeletingLogo}
                          className="flex items-center text-sm font-bold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {isDeletingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Nome da Empresa</Label>
                  <Input
                    value={settings.company_name || ""}
                    onChange={(e) => setSettings((p) => ({ ...p, company_name: e.target.value }))}
                    className="!bg-white !text-slate-900 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">WhatsApp</Label>
                  <Input
                    value={settings.support_whatsapp || ""}
                    onChange={(e) => setSettings((p) => ({ ...p, support_whatsapp: e.target.value }))}
                    className="!bg-white !text-slate-900 border-slate-200"
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color || "#2563EB"}
                      onChange={(e) => setSettings((p) => ({ ...p, primary_color: e.target.value }))}
                      className="w-12 h-10 p-1 !bg-white border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color || ""}
                      onChange={(e) => setSettings((p) => ({ ...p, primary_color: e.target.value }))}
                      className="flex-1 !bg-white !text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Texto do Rodapé</Label>
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
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferências</h2>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div>
                <div className="font-medium text-slate-900">Notificações Sonoras</div>
                <div className="text-xs text-slate-500">Tocar som ao concluir tarefas.</div>
              </div>
              <Switch
                checked={!!settings.enable_sounds}
                onCheckedChange={(v) => setSettings((p) => ({ ...p, enable_sounds: v }))}
              />
            </div>
          </motion.div>
        </div>

        {/* COLUNA DIREITA: Preview Sticky */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-semibold">Prévia em Tempo Real</h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white">
              <div className="p-5" style={{ backgroundColor: secondaryColor }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.logo_display_url ? (
                      <img src={settings.logo_display_url} className="h-10 w-10 rounded-lg object-contain bg-white/20 p-1" />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span className="text-white font-bold">{initialLetter}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-white text-lg block">{companyName}</span>
                      {whatsappText && (
                        <span className="text-white/60 text-[10px]">WhatsApp: {whatsappText}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/60 text-[10px] uppercase tracking-wider">Relatório</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <h2
                  className="text-xl font-black text-slate-900 border-b-4 inline-block pb-1"
                  style={{ borderBottomColor: primaryColor }}
                >
                  Pizzaria Roma
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: "456", l: "Views" },
                    { v: "23", l: "Call" },
                    { v: "89", l: "Maps" },
                  ].map((k) => (
                    <div
                      key={k.l}
                      className="p-3 rounded-2xl text-center border border-slate-100"
                      style={{ backgroundColor: `${primaryColor}08` }}
                    >
                      <div className="text-2xl font-black mb-1" style={{ color: primaryColor }}>
                        {k.v}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{k.l}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-900 uppercase">Tarefas Concluídas</div>
                  {["Postar 3 fotos", "Responder avaliações"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} /> {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 text-center text-[10px] font-bold text-slate-400 border-t border-slate-100 uppercase tracking-widest">
                {footerText}
                {whatsappText && ` • WhatsApp: ${whatsappText}`}
              </div>
            </div>
            <p className="text-center text-xs text-slate-400">Layout simplificado para visualização.</p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
