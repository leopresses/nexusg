import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BrandSettings = {
  id?: string;
  user_id?: string;
  company_name?: string | null;
  primary_color?: string | null;
  logo_url?: string | null;
  report_footer?: string | null;
  updated_at?: string | null;
};

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<BrandSettings>({
    company_name: "",
    primary_color: "#2563EB",
    logo_url: "",
    report_footer: "Relatório gerado por Gestão Nexus",
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
          company_name: data.company_name ?? "",
          primary_color: data.primary_color ?? "#2563EB",
          logo_url: data.logo_url ?? "",
          report_footer: data.report_footer ?? "Relatório gerado por Gestão Nexus",
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        company_name: settings.company_name || null,
        primary_color: settings.primary_color || "#2563EB",
        logo_url: settings.logo_url || null,
        report_footer: settings.report_footer || null,
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

  const companyName = settings.company_name || "Sua Empresa";
  const primaryColor = settings.primary_color || "#2563EB";
  const footerText = settings.report_footer || "Relatório gerado por Gestão Nexus";

  if (isLoading) return <AppLayout title="Configurações">Carregando...</AppLayout>;

  return (
    <AppLayout title="Configurações" subtitle="Gerencie sua marca e preferências">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LADO ESQUERDO: Formulário */}
        <div className="space-y-6">
          <motion.div
            className="rounded-3xl bg-card border border-border p-8 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-foreground">Identidade visual</h2>
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary rounded-xl">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4" />} Salvar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={settings.company_name || ""}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="rounded-xl border-border"
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
                  value={settings.report_footer || ""}
                  onChange={(e) => setSettings({ ...settings, report_footer: e.target.value })}
                  className="rounded-xl border-border min-h-[100px]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* LADO DIREITO: Prévia do PDF */}
        <div className="sticky top-24">
          <motion.div
            className="rounded-[32px] overflow-hidden border border-border shadow-2xl bg-card"
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
                <span className="text-white/60 text-sm">Preview do Relatório</span>
              </div>
            </div>

            <div className="p-8 space-y-8 min-h-[400px]">
              <h2
                className="text-2xl font-black text-foreground border-b-4 inline-block"
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
                    className="p-4 rounded-2xl text-center border border-border"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <div className="text-2xl font-black mb-1" style={{ color: primaryColor }}>
                      {k.v}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-bold text-foreground">Ações Concluídas</div>
                {["Postar 3 fotos", "Responder reviews"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted text-center text-[10px] font-bold text-muted-foreground border-t border-border uppercase tracking-widest">
              {footerText}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
