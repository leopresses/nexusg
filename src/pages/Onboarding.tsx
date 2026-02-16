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
  Loader2,
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

interface BusinessTypeOption {
  id: BusinessType;
  icon: typeof Utensils;
  label: string;
  key: string;
}

const businessTypes: BusinessTypeOption[] = [
  { id: "restaurant", icon: Utensils, label: "Restaurante", key: "restaurant" },
  { id: "cafe_service", icon: Coffee, label: "Café / Serviços", key: "cafe" },
  { id: "barbershop_salon", icon: Scissors, label: "Barbearia / Salão", key: "barbershop" },
  { id: "store", icon: ShoppingBag, label: "Loja", key: "store" },
  { id: "other", icon: Store, label: "Outro", key: "other" },
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    googleBusinessUrl: "",
  });

  // Get the selected business type from the key
  const selectedType = businessTypes.find((t) => t.key === selectedKey)?.id || null;

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
    if (currentStep === 1) return selectedKey !== null;
    if (currentStep === 2) return formData.name.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative overflow-hidden">
      {/* Soft background accents (premium, light) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      {/* Left side - Progress */}
      <div className="hidden lg:flex w-80 flex-col p-8 relative">
        <div className="absolute inset-0 rounded-none bg-white/70 backdrop-blur-xl border-r border-slate-200" />
        <div className="relative">
          <Logo size="md" />

          <div className="mt-16 space-y-6">
            {steps.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <motion.div
                    layout
                    className={[
                      "h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all",
                      isDone
                        ? "bg-emerald-500 text-white shadow-sm"
                        : isCurrent
                          ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-600/10"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                    ].join(" ")}
                  >
                    {isDone ? <Check className="h-5 w-5" /> : step.id}
                  </motion.div>

                  <div className="pt-0.5">
                    <h3
                      className={["font-medium", currentStep >= step.id ? "text-slate-900" : "text-slate-500"].join(
                        " ",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-10">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Dica</span>
              </div>
              <p className="text-sm text-slate-600">
                Seu plano atual permite{" "}
                {profile?.clients_limit && profile.clients_limit >= 999999
                  ? "clientes ilimitados"
                  : `${profile?.clients_limit || 1} cliente(s)`}
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        <div className="w-full max-w-xl">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
            <div className="mt-6 flex items-center gap-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={[
                    "h-2 flex-1 rounded-full transition-all",
                    currentStep >= step.id ? "bg-blue-600" : "bg-slate-200",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* Card container (premium) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] p-6 sm:p-8">
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
                    Qual é o tipo do seu <span className="text-blue-600">cliente</span>?
                  </h1>
                  <p className="text-slate-600 mb-8">Isso nos ajuda a personalizar as tarefas semanais</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {businessTypes.map((type) => {
                      const selected = selectedKey === type.key;
                      const Icon = type.icon;

                      return (
                        <motion.button
                          key={type.key}
                          onClick={() => setSelectedKey(type.key)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={[
                            "p-5 sm:p-6 rounded-2xl border text-left transition-all duration-200",
                            "bg-white/90 hover:bg-white shadow-sm hover:shadow-md",
                            selected
                              ? "border-blue-600 ring-4 ring-blue-600/10"
                              : "border-slate-200 hover:border-blue-300",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "h-12 w-12 rounded-2xl flex items-center justify-center mb-3 transition-all",
                              selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          <span className="font-semibold text-slate-900">{type.label}</span>
                          <div className="mt-1 text-xs text-slate-500">Selecionar</div>
                        </motion.button>
                      );
                    })}
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
                    Informações do <span className="text-blue-600">estabelecimento</span>
                  </h1>
                  <p className="text-slate-600 mb-8">Dados básicos para identificar seu cliente</p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700">
                        Nome do estabelecimento
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="name"
                          placeholder="Ex: Pizzaria Roma"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-slate-700">
                        Endereço (opcional)
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="address"
                          placeholder="Rua, número, cidade"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="pl-10 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600/30"
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
                    Vincular <span className="text-blue-600">Google Business</span>
                  </h1>
                  <p className="text-slate-600 mb-8">Opcional: conecte para acompanhar métricas automaticamente</p>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                          <Globe className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Google Business Profile</h3>
                          <p className="text-sm text-slate-600">Sincronize visualizações, chamadas e rotas</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="googleUrl" className="text-slate-700">
                          URL do Google Business
                        </Label>
                        <Input
                          id="googleUrl"
                          placeholder="https://business.google.com/..."
                          value={formData.googleBusinessUrl}
                          onChange={(e) => setFormData({ ...formData, googleBusinessUrl: e.target.value })}
                          className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600/30"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-sm text-slate-700">
                        <span className="text-blue-700 font-semibold">Pule se preferir:</span> Você pode conectar o
                        Google Business a qualquer momento nas configurações do cliente.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-4 mt-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStep === 1 ? (
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/dashboard")}
                      disabled={isLoading}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="min-w-[160px] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
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

              {/* Back to dashboard link */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors text-center"
              >
                ← Voltar para o Painel
              </button>
            </div>
          </div>

          {/* Subtle footer note */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Finalize o onboarding para começar a gerar tarefas e relatórios.
          </div>
        </div>
      </div>
    </div>
  );
}
