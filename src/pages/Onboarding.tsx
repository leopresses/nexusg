import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
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
  Camera,
  Search,
  Star,
  AlertCircle,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlacesSearch, type PlaceCandidate } from "@/hooks/usePlacesSearch";
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
  { id: 2, title: "Informações", description: "Dados e foto do estabelecimento" },
  { id: 3, title: "Google Place ID", description: "Vincular perfil (opcional)" },
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
  });

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Place ID search state
  const { isSearching, isFetchingDetails, candidates, searchError, searchPlaces, fetchPlaceDetails, clearSearch } =
    usePlacesSearch();
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [manualPlaceId, setManualPlaceId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null);

  const selectedType = businessTypes.find((t) => t.key === selectedKey)?.id || null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSearch = async () => {
    await searchPlaces(searchName, searchAddress);
  };

  const handleSelectCandidate = (candidate: PlaceCandidate) => {
    setSelectedPlace(candidate);
  };

  // Initialize search fields when entering step 3
  const goToStep3 = () => {
    setSearchName(formData.name);
    setSearchAddress(formData.address);
    setSelectedPlace(null);
    setShowManualInput(false);
    clearSearch();
    setCurrentStep(3);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      goToStep3();
      return;
    }

    // Step 3 - Finish: create client
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Check limit
      const { data: canAdd, error: canAddError } = await supabase.rpc("can_add_client", { _user_id: user.id });
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

      // Determine place_id to use
      const placeIdToUse = selectedPlace?.place_id || (showManualInput && manualPlaceId.trim()) || null;

      // Create client
      const { data: newClient, error: insertError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: formData.name,
          business_type: selectedType || "other",
          address: formData.address || null,
          place_id: placeIdToUse,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const clientId = newClient.id;

      // Upload photo if selected
      if (photoFile && clientId) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${user.id}/${clientId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("client-avatars")
          .upload(fileName, photoFile, { upsert: true });

        if (!uploadError) {
          const baseUrl = import.meta.env.VITE_SUPABASE_URL;
          const storedUrl = `${baseUrl}/storage/v1/object/public/client-avatars/${fileName}`;

          await supabase.from("clients").update({ avatar_url: storedUrl }).eq("id", clientId);
        }
      }

      // Fetch place details if place_id was provided
      if (placeIdToUse) {
        await fetchPlaceDetails(placeIdToUse, clientId);
      }

      toast({ title: "Cliente criado!", description: `${formData.name} foi adicionado com sucesso.` });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({ title: "Erro ao criar cliente", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedKey !== null;
    if (currentStep === 2) return formData.name.length > 0;
    return true; // Step 3 is optional
  };

  const formatTypes = (types: string[]): string => {
    const typeMap: Record<string, string> = {
      restaurant: "Restaurante",
      cafe: "Café",
      bar: "Bar",
      store: "Loja",
      food: "Alimentação",
      point_of_interest: "Ponto de interesse",
      establishment: "Estabelecimento",
      beauty_salon: "Salão de Beleza",
      hair_care: "Cabeleireiro",
    };
    const mapped = types.filter((t) => typeMap[t]).map((t) => typeMap[t]).slice(0, 2);
    return mapped.length > 0 ? mapped.join(", ") : "Negócio";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative overflow-hidden">
      {/* Soft background accents */}
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
                    <h3 className={["font-medium", currentStep >= step.id ? "text-slate-900" : "text-slate-500"].join(" ")}>
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

          {/* Card container */}
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

              {/* Step 2: Business Info + Photo */}
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
                  <p className="text-slate-600 mb-8">Dados básicos e foto para identificar seu cliente</p>

                  <div className="space-y-6">
                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label className="text-slate-700">Foto do Cliente (opcional)</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handlePhotoSelect}
                              className="hidden"
                              id="onboarding-photo"
                            />
                            <label htmlFor="onboarding-photo">
                              <Button variant="outline" size="sm" asChild className="border-slate-200 text-slate-600 hover:bg-slate-50">
                                <span>
                                  <Camera className="h-4 w-4 mr-2" />
                                  {photoPreview ? "Trocar" : "Escolher foto"}
                                </span>
                              </Button>
                            </label>
                            {photoPreview && (
                              <Button variant="ghost" size="sm" onClick={removePhoto} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">PNG, JPG ou WebP. Max 2MB.</p>
                        </div>
                      </div>
                    </div>

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

              {/* Step 3: Google Place ID */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-3xl font-bold mb-2">
                    Vincular <span className="text-blue-600">Google Place ID</span>
                  </h1>
                  <p className="text-slate-600 mb-6">Opcional: vincule para acessar avaliações, fotos e dados públicos</p>

                  {selectedPlace ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-emerald-900">{selectedPlace.name}</p>
                            <p className="text-sm text-emerald-700 truncate">{selectedPlace.formatted_address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-emerald-600">{formatTypes(selectedPlace.types)}</span>
                              {selectedPlace.rating && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                                  <Star className="h-3 w-3 fill-current" />
                                  {selectedPlace.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedPlace(null); clearSearch(); }}
                        className="text-slate-500 hover:text-blue-600"
                      >
                        Escolher outro lugar
                      </Button>
                    </div>
                  ) : !showManualInput ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="searchName" className="text-xs text-slate-700">Nome do negócio</Label>
                          <Input
                            id="searchName"
                            placeholder="Ex: Pizzaria Roma"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="h-9 bg-white border-slate-200 text-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="searchAddress" className="text-xs text-slate-700">Cidade/Endereço</Label>
                          <Input
                            id="searchAddress"
                            placeholder="Ex: São Paulo"
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            className="h-9 bg-white border-slate-200 text-slate-900"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSearch}
                        disabled={isSearching || (!searchName.trim() && !searchAddress.trim())}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        Buscar no Google
                      </Button>

                      {searchError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{searchError}</p>
                        </div>
                      )}

                      {candidates.length > 0 && (
                        <ScrollArea className="h-[200px] rounded-lg border border-slate-100 p-1">
                          <div className="space-y-2">
                            {candidates.map((candidate) => (
                              <button
                                key={candidate.place_id}
                                onClick={() => handleSelectCandidate(candidate)}
                                className="w-full text-left rounded-lg border border-slate-200 p-3 bg-white hover:bg-slate-50 hover:border-blue-300 transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <MapPin className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-slate-900 truncate">{candidate.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{candidate.formatted_address}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-slate-400">{formatTypes(candidate.types)}</span>
                                      {candidate.rating && (
                                        <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                                          <Star className="h-3 w-3 fill-current" />
                                          {candidate.rating.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManualInput(true)}
                        className="w-full text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        Prefiro inserir o Place ID manualmente
                      </Button>

                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <p className="text-sm text-slate-700">
                          <span className="text-blue-700 font-semibold">Pule se preferir:</span> Você pode vincular o
                          Google Place ID a qualquer momento nas configurações do cliente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manualPlaceId" className="text-slate-700">Google Place ID</Label>
                        <Input
                          id="manualPlaceId"
                          placeholder="ChIJ..."
                          value={manualPlaceId}
                          onChange={(e) => setManualPlaceId(e.target.value)}
                          className="bg-white border-slate-200 text-slate-900"
                        />
                        <p className="text-xs text-slate-500">
                          Cole o Place ID obtido no{" "}
                          <a
                            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Place ID Finder
                          </a>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManualInput(false)}
                        className="text-slate-500 hover:text-blue-600"
                      >
                        ← Voltar para busca automática
                      </Button>
                    </div>
                  )}
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
