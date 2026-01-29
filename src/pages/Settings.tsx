import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
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
  User,
  Lock,
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GoogleIntegrationSettings } from "@/components/google/GoogleIntegrationSettings";

// Account Settings Component
function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleSaveName = async () => {
    if (!user) return;
    
    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi salvo com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating name:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("1 letra maiúscula");
    if (!/[0-9]/.test(pwd)) errors.push("1 número");
    return { valid: errors.length === 0, errors };
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Preencha todos os campos",
        description: "Todos os campos de senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(passwordForm.newPassword);
    if (!validation.valid) {
      toast({
        title: "Senha fraca",
        description: `Requisitos: ${validation.errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Senha atual incorreta",
          description: "A senha atual informada está incorreta.",
          variant: "destructive",
        });
        setIsChangingPassword(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Gerencie suas informações de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={user?.email || ""} 
              disabled 
              className="bg-secondary border-border" 
            />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <div className="flex gap-2">
              <Input 
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-border" 
                placeholder="Seu nome completo"
              />
              <Button 
                onClick={handleSaveName} 
                disabled={isSavingName || fullName === profile?.full_name}
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Altere sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input 
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="bg-secondary border-border" 
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input 
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="bg-secondary border-border" 
                  placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="bg-secondary border-border" 
                  placeholder="Repita a nova senha"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  disabled={isChangingPassword}
                >
                  Cancelar
                </Button>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Nova Senha
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Preferences Settings Component
function PreferencesSettings() {
  const { preferences, updateSoundEnabled, playStatusChangeSound } = useUserPreferences();

  const handleSoundToggle = async (enabled: boolean) => {
    await updateSoundEnabled(enabled);
    if (enabled) {
      // Play a test sound when enabling
      playStatusChangeSound();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>Personalize sua experiência no aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {preferences.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="sound-toggle" className="font-medium">
                  Som de Ações
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Tocar som ao mudar status de tarefas
              </p>
            </div>
            <Switch
              id="sound-toggle"
              checked={preferences.soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
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

            <TabsContent value="integrations" className="space-y-6">
              <GoogleIntegrationSettings />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesSettings />
            </TabsContent>

            <TabsContent value="account">
              <AccountSettings />
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
                        {(profile?.clients_limit || 1) >= 999999 
                          ? "Clientes ilimitados" 
                          : `${profile?.clients_limit || 1} cliente${(profile?.clients_limit || 1) > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Limite de clientes</p>
                      <p className="text-2xl font-bold text-primary">
                        {(profile?.clients_limit || 1) >= 999999 ? "∞" : profile?.clients_limit || 1}
                      </p>
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
