import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Sparkles,
  Store,
  Utensils,
  Scissors,
  Coffee,
  ShoppingBag,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BusinessType = Database["public"]["Enums"]["business_type"];

const businessTypes: { id: BusinessType; icon: typeof Utensils; label: string }[] = [
  { id: "restaurant", icon: Utensils, label: "Restaurante" },
  { id: "service", icon: Coffee, label: "Café / Serviços" },
  { id: "service", icon: Scissors, label: "Barbearia / Salão" },
  { id: "store", icon: ShoppingBag, label: "Loja" },
  { id: "other", icon: Store, label: "Outro" },
];

const steps = [
  { id: 1, title: "Tipo de Negócio", description: "Qual é o segmento?" },
  { id: 2, title: "Informações", description: "Dados do estabelecimento" },
  { id: 3, title: "Google Business", description: "Vincular perfil (opcional)" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    googleBusinessUrl: "",
  });

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding - create client
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar um cliente.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        // Check if user can add more clients
        const { data: canAdd, error: canAddError } = await supabase.rpc("can_add_client", {
          _user_id: user.id,
        });

        if (canAddError) throw canAddError;

        if (!canAdd) {
          toast({
            title: "Limite atingido",
            description: `Você atingiu o limite de ${profile?.clients_limit || 1} cliente(s) do seu plano. Faça upgrade para adicionar mais.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Create the client
        const { error: insertError } = await supabase.from("clients").insert({
          user_id: user.id,
          name: formData.name,
          business_type: selectedType || "other",
          address: formData.address || null,
          google_business_id: formData.googleBusinessUrl || null,
        });

        if (insertError) throw insertError;

        toast({
          title: "Cliente criado!",
          description: `${formData.name} foi adicionado com sucesso.`,
        });

        navigate("/dashboard");
      } catch (error: any) {
        console.error("Error creating client:", error);
        toast({
          title: "Erro ao criar cliente",
          description: error.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedType !== null;
    if (currentStep === 2) return formData.name.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Progress */}
      <div className="hidden lg:flex w-80 bg-sidebar border-r border-sidebar-border flex-col p-8">
        <Logo size="md" />
        
        <div className="mt-16 space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className={`
                h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all
                ${currentStep > step.id 
                  ? "gradient-gold text-primary-foreground" 
                  : currentStep === step.id 
                    ? "bg-primary/20 text-primary border-2 border-primary" 
                    : "bg-secondary text-muted-foreground"
                }
              `}>
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div>
                <h3 className={`font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Dica</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu plano atual permite {profile?.clients_limit && profile.clients_limit >= 999999 
                ? "clientes ilimitados" 
                : `${profile?.clients_limit || 1} cliente(s)`}.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
            <div className="mt-6 flex items-center gap-2">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    currentStep >= step.id ? "gradient-gold" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Business Type */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-bold mb-2">
                  Qual é o tipo do seu <span className="text-gradient-gold">cliente</span>?
                </h1>
                <p className="text-muted-foreground mb-8">
                  Isso nos ajuda a personalizar as tarefas semanais
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {businessTypes.map((type, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedType(type.id)}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-200 text-left
                        ${selectedType === type.id 
                          ? "border-primary bg-primary/10 shadow-gold" 
                          : "border-border hover:border-primary/50 bg-card"
                        }
                      `}
                    >
                      <type.icon className={`h-8 w-8 mb-3 ${selectedType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Business Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-bold mb-2">
                  Informações do <span className="text-gradient-gold">estabelecimento</span>
                </h1>
                <p className="text-muted-foreground mb-8">
                  Dados básicos para identificar seu cliente
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do estabelecimento</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Ex: Pizzaria Roma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-12 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço (opcional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Rua, número, cidade"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="pl-10 h-12 bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Google Business */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-bold mb-2">
                  Vincular <span className="text-gradient-gold">Google Business</span>
                </h1>
                <p className="text-muted-foreground mb-8">
                  Opcional: conecte para acompanhar métricas automaticamente
                </p>

                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Google Business Profile</h3>
                        <p className="text-sm text-muted-foreground">Sincronize visualizações, chamadas e rotas</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="googleUrl">URL do Google Business</Label>
                      <Input
                        id="googleUrl"
                        placeholder="https://business.google.com/..."
                        value={formData.googleBusinessUrl}
                        onChange={(e) => setFormData({ ...formData, googleBusinessUrl: e.target.value })}
                        className="h-12 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-primary font-medium">Pule se preferir:</span> Você pode conectar o Google Business a qualquer momento nas configurações do cliente.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10">
            <div className="flex items-center gap-2">
              {currentStep === 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentStep === 3 ? (
                <>
                  Concluir
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
