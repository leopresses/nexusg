import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Upload,
  Palette,
  Building2,
  Save,
  Eye,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";

interface WhiteLabelSettings {
  companyName: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  reportFooter: string;
  showPoweredBy: boolean;
}

const defaultSettings: WhiteLabelSettings = {
  companyName: "Gestão Nexus",
  logo: null,
  primaryColor: "#22c55e",
  secondaryColor: "#0a1628",
  accentColor: "#06b6d4",
  reportFooter: "Relatório gerado por Gestão Nexus",
  showPoweredBy: true,
};

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhiteLabelSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Suas personalizações foram aplicadas com sucesso.",
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({
      title: "Configurações resetadas",
      description: "Voltou para as configurações padrão.",
    });
  };

  return (
    <AppLayout 
      title="Configurações" 
      subtitle="Personalize sua experiência e marca"
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      }
    >

      <Tabs defaultValue="whitelabel" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="whitelabel">White Label</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
        </TabsList>

            <TabsContent value="whitelabel" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Settings Form */}
                <div className="space-y-6">
                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Informações da Empresa
                      </CardTitle>
                      <CardDescription>
                        Personalize como sua marca aparece nos relatórios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input
                          id="companyName"
                          value={settings.companyName}
                          onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Logo da Empresa</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                            {settings.logo ? (
                              <img src={settings.logo} alt="Logo" className="h-full w-full object-contain" />
                            ) : (
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <input
                              type="file"
                              id="logo-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <Label htmlFor="logo-upload">
                              <Button variant="outline" size="sm" asChild>
                                <span>Escolher arquivo</span>
                              </Button>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG até 2MB. Recomendado: 200x200px
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reportFooter">Texto do rodapé dos relatórios</Label>
                        <Input
                          id="reportFooter"
                          value={settings.reportFooter}
                          onChange={(e) => setSettings({ ...settings, reportFooter: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Ex: Relatório gerado por Sua Empresa"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Cores da Marca
                      </CardTitle>
                      <CardDescription>
                        Defina as cores que aparecerão nos relatórios PDF
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Cor Primária</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              id="primaryColor"
                              value={settings.primaryColor}
                              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={settings.primaryColor}
                              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                              className="bg-secondary border-border flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="secondaryColor">Cor Secundária</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              id="secondaryColor"
                              value={settings.secondaryColor}
                              onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={settings.secondaryColor}
                              onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                              className="bg-secondary border-border flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accentColor">Cor de Destaque</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              id="accentColor"
                              value={settings.accentColor}
                              onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={settings.accentColor}
                              onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                              className="bg-secondary border-border flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Pré-visualização do Relatório</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewMode ? "Modo Edição" : "Modo Preview"}
                    </Button>
                  </div>

                  <motion.div 
                    className="rounded-xl border border-border overflow-hidden shadow-elevated"
                    style={{ 
                      background: previewMode ? "#ffffff" : undefined,
                    }}
                  >
                    {/* Report Header Preview */}
                    <div 
                      className="p-6"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {settings.logo ? (
                            <img src={settings.logo} alt="Logo" className="h-10 w-10 object-contain" />
                          ) : (
                            <div 
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: settings.primaryColor }}
                            >
                              <span className="text-white font-bold">
                                {settings.companyName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="font-bold text-white">{settings.companyName}</span>
                        </div>
                        <span className="text-white/70 text-sm">Relatório Semanal</span>
                      </div>
                    </div>

                    {/* Report Content Preview */}
                    <div className="p-6 bg-white">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Pizzaria Roma</h2>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: `${settings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>456</div>
                          <div className="text-xs text-gray-500">Visualizações</div>
                        </div>
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: `${settings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>23</div>
                          <div className="text-xs text-gray-500">Chamadas</div>
                        </div>
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: `${settings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>89</div>
                          <div className="text-xs text-gray-500">Rotas</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 text-sm">Tarefas Concluídas</h3>
                        <div className="space-y-1">
                          {["Postar 3 fotos", "Responder avaliações", "Atualizar horário"].map((task, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div 
                                className="h-4 w-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: settings.primaryColor }}
                              >
                                <span className="text-white text-[10px]">✓</span>
                              </div>
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Report Footer Preview */}
                    <div 
                      className="p-4 text-center text-sm"
                      style={{ 
                        backgroundColor: settings.secondaryColor,
                        color: "rgba(255,255,255,0.7)"
                      }}
                    >
                      {settings.reportFooter}
                    </div>
                  </motion.div>

                  <p className="text-sm text-muted-foreground text-center">
                    Esta é uma prévia de como seu relatório PDF será exibido
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Conta</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value="usuario@email.com" disabled className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input defaultValue="João Silva" className="bg-secondary border-border" />
                  </div>
                  <Button variant="outline">Alterar Senha</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plan">
              <Card>
                <CardHeader>
                  <CardTitle>Seu Plano Atual</CardTitle>
                  <CardDescription>Gerencie sua assinatura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Plano Pro</h3>
                      <p className="text-sm text-muted-foreground">5 clientes • R$49/mês</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Clientes usados</p>
                      <p className="text-2xl font-bold text-primary">3/5</p>
                    </div>
                  </div>
                  <Button className="w-full">Fazer Upgrade</Button>
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
