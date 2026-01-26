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
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";

const businessTypes = [
  { id: "restaurant", icon: Utensils, label: "Restaurante" },
  { id: "cafe", icon: Coffee, label: "Café / Padaria" },
  { id: "barbershop", icon: Scissors, label: "Barbearia / Salão" },
  { id: "store", icon: ShoppingBag, label: "Loja" },
  { id: "services", icon: Store, label: "Serviços" },
];

const steps = [
  { id: 1, title: "Tipo de Negócio", description: "Qual é o segmento?" },
  { id: 2, title: "Informações", description: "Dados do estabelecimento" },
  { id: 3, title: "Google Business", description: "Vincular perfil (opcional)" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    googleBusinessUrl: "",
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding
      navigate("/dashboard");
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
              Você pode adicionar mais clientes depois nas configurações.
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
                  Qual é o tipo do seu <span className="text-gradient-gold">primeiro cliente</span>?
                </h1>
                <p className="text-muted-foreground mb-8">
                  Isso nos ajuda a personalizar as tarefas semanais
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
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
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-blue-500" />
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
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={currentStep === 1 ? "invisible" : ""}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-w-[140px]"
            >
              {currentStep === 3 ? (
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
