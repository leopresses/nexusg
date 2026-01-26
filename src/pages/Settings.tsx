import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Upload,
  Palette,
  Building2,
  Save,
  Eye,
  RotateCcw,
  Trash2,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { 
    brandSettings, 
    isLoading, 
    isUploading,
    updateBrandSettings, 
    uploadLogo,
    deleteLogo 
  } = useBrandSettings();
  
  const [localSettings, setLocalSettings] = useState({
    companyName: "",
    logo: null as string | null,
    primaryColor: "#22c55e",
    secondaryColor: "#0a1628",
    accentColor: "#06b6d4",
    reportFooter: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local settings with fetched brand settings
  useEffect(() => {
    if (!isLoading) {
      setLocalSettings({
        companyName: brandSettings.companyName,
        logo: brandSettings.logo,
        primaryColor: brandSettings.primaryColor,
        secondaryColor: brandSettings.secondaryColor,
        accentColor: brandSettings.accentColor,
        reportFooter: brandSettings.reportFooter,
      });
    }
  }, [brandSettings, isLoading]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { url, error } = await uploadLogo(file);
    
    if (error) {
      toast({
        title: "Erro ao fazer upload",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (url) {
      setLocalSettings((prev) => ({ ...prev, logo: url }));
      toast({
        title: "Logo carregado!",
        description: "Clique em 'Salvar Alterações' para aplicar.",
      });
    }
  };

  const handleDeleteLogo = async () => {
    const { success, error } = await deleteLogo();
    
    if (error) {
      toast({
        title: "Erro ao remover logo",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (success) {
      setLocalSettings((prev) => ({ ...prev, logo: null }));
      toast({
        title: "Logo removido",
        description: "O logo foi removido com sucesso.",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const result = await updateBrandSettings(localSettings);
    
    if (result.error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configurações salvas!",
        description: "Suas personalizações foram aplicadas com sucesso.",
      });
    }
    
    setIsSaving(false);
  };

  const handleReset = () => {
    setLocalSettings({
      companyName: "Gestão Nexus",
      logo: brandSettings.logo, // Keep the uploaded logo
      primaryColor: "#22c55e",
      secondaryColor: "#0a1628",
      accentColor: "#06b6d4",
      reportFooter: "Relatório gerado por Gestão Nexus",
    });
    toast({
      title: "Configurações resetadas",
      description: "Voltou para as configurações padrão (exceto logo).",
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Configurações" subtitle="Personalize sua experiência e marca">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Configurações" 
      subtitle="Personalize sua experiência e marca"
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
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
                          value={localSettings.companyName}
                          onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Logo da Empresa</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative">
                            {isUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            ) : localSettings.logo ? (
                              <img 
                                src={localSettings.logo} 
                                alt="Logo" 
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = '';
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id="logo-upload"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={isUploading}
                              />
                              <Label htmlFor="logo-upload">
                                <Button variant="outline" size="sm" asChild disabled={isUploading}>
                                  <span>
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Escolher arquivo
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </Label>
                              {localSettings.logo && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleDeleteLogo}
                                  disabled={isUploading}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WebP ou SVG até 2MB. Recomendado: 200x200px
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reportFooter">Texto do rodapé dos relatórios</Label>
                        <Input
                          id="reportFooter"
                          value={localSettings.reportFooter}
                          onChange={(e) => setLocalSettings({ ...localSettings, reportFooter: e.target.value })}
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
                              value={localSettings.primaryColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={localSettings.primaryColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
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
                              value={localSettings.secondaryColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, secondaryColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={localSettings.secondaryColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, secondaryColor: e.target.value })}
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
                              value={localSettings.accentColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, accentColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={localSettings.accentColor}
                              onChange={(e) => setLocalSettings({ ...localSettings, accentColor: e.target.value })}
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
                      style={{ backgroundColor: localSettings.secondaryColor }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {localSettings.logo ? (
                            <img 
                              src={localSettings.logo} 
                              alt="Logo" 
                              className="h-10 w-10 object-contain rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div 
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: localSettings.primaryColor }}
                            >
                              <span className="text-white font-bold">
                                {localSettings.companyName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="font-bold text-white">{localSettings.companyName}</span>
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
                          style={{ backgroundColor: `${localSettings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: localSettings.primaryColor }}>456</div>
                          <div className="text-xs text-gray-500">Visualizações</div>
                        </div>
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: `${localSettings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: localSettings.primaryColor }}>23</div>
                          <div className="text-xs text-gray-500">Chamadas</div>
                        </div>
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: `${localSettings.primaryColor}15` }}
                        >
                          <div className="text-2xl font-bold" style={{ color: localSettings.primaryColor }}>89</div>
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
                                style={{ backgroundColor: localSettings.primaryColor }}
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
                        backgroundColor: localSettings.secondaryColor,
                        color: "rgba(255,255,255,0.7)"
                      }}
                    >
                      {localSettings.reportFooter}
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
                    <Input 
                      value={user?.email || ""} 
                      disabled 
                      className="bg-secondary border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input 
                      defaultValue={profile?.full_name || ""} 
                      className="bg-secondary border-border" 
                    />
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
                      <h3 className="font-semibold text-lg capitalize">{profile?.plan || "Starter"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.clients_limit || 1} cliente{(profile?.clients_limit || 1) > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Limite de clientes</p>
                      <p className="text-2xl font-bold text-primary">{profile?.clients_limit || 1}</p>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <a href="/pricing">Ver Planos</a>
                  </Button>
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
