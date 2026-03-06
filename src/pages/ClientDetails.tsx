import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Globe,
  Star,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ListTodo,
  ClipboardCheck,
  Rocket,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  X,
  Bell,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel } from "@/config/plans";
import { toast } from "sonner";
import { translateWeekdayLine } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: string;
  relative_time_description?: string;
}

interface PlaceSnapshot {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  photos?: { photo_reference: string; url?: string }[];
  photo_urls?: string[];
  business_status?: string;
  reviews?: PlaceReview[];
}

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (clientId) fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId!).single();
      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Cliente não encontrado");
    } finally {
      setIsLoading(false);
    }
  };

  const snapshot: PlaceSnapshot = (client?.place_snapshot as any) || {};
  const hasSnapshot = Object.keys(snapshot).length > 0 && snapshot.place_id;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSync = async () => {
    if (!client?.place_id) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("places-details", {
        body: { place_id: client.place_id, client_id: client.id, sync_reviews: true },
      });
      if (error || data?.error) throw new Error(data?.message || "Erro ao sincronizar");
      toast.success("Dados sincronizados com sucesso!");
      fetchClient();
    } catch (err: any) {
      toast.error(err.message || "Erro ao sincronizar dados");
    } finally {
      setIsSyncing(false);
    }
  };

  const typeLabels: Record<string, string> = {
    restaurant: "Restaurante",
    cafe: "Café",
    bar: "Bar",
    store: "Loja",
    food: "Alimentação",
    point_of_interest: "Ponto de interesse",
    establishment: "Estabelecimento",
    beauty_salon: "Salão de Beleza",
    hair_care: "Cabeleireiro",
    spa: "Spa",
    gym: "Academia",
    bakery: "Padaria",
    clothing_store: "Loja de Roupas",
    shopping_mall: "Shopping",
    supermarket: "Supermercado",
    pharmacy: "Farmácia",
    hospital: "Hospital",
    dentist: "Dentista",
    doctor: "Médico",
    lawyer: "Advogado",
    accounting: "Contabilidade",
    real_estate_agency: "Imobiliária",
    car_dealer: "Concessionária",
    car_repair: "Oficina",
    gas_station: "Posto de Combustível",
    lodging: "Hospedagem",
    pet_store: "Pet Shop",
    veterinary_care: "Veterinário",
  };

  const formatType = (t: string) => typeLabels[t] || t.replace(/_/g, " ");

  const statusLabels: Record<string, { label: string; color: string }> = {
    OPERATIONAL: { label: "Em funcionamento", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    CLOSED_TEMPORARILY: { label: "Fechado temporariamente", color: "bg-amber-100 text-amber-700 border-amber-200" },
    CLOSED_PERMANENTLY: { label: "Fechado permanentemente", color: "bg-red-100 text-red-700 border-red-200" },
  };

  const mapsUrl =
    snapshot.url ||
    (client?.place_id ? `https://www.google.com/maps/search/?api=1&query_place_id=${client.place_id}` : null);

  if (isLoading) {
    return (
      <AppLayout title="Detalhes do Cliente" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 !bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando dados do cliente…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Cliente não encontrado" subtitle="">
        <div className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-12 text-center">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-slate-900">Cliente não encontrado</h3>
          <p className="text-slate-500 mb-6">O cliente solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate("/clients")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Clientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const displayName = snapshot.name || client.name;
  const displayAddress = snapshot.formatted_address || client.address;
  const placeId = client.place_id;

  const btnClass = "rounded-xl border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600";

  return (
    <AppLayout
      title={displayName}
      subtitle="Detalhes e dados sincronizados do cliente"
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {placeId && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className={btnClass}>
              {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tasks?client=${client.id}`)}
            className={btnClass}
          >
            <ListTodo className="h-4 w-4 mr-2" /> Tarefas
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/audit/${client.id}`)} className={btnClass}>
            <ClipboardCheck className="h-4 w-4 mr-2" /> Auditoria
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/alerts")} className={btnClass}>
            <Bell className="h-4 w-4 mr-2" /> Alertas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/recovery?client=${client.id}`)}
            className={btnClass}
          >
            <ShieldAlert className="h-4 w-4 mr-2" /> Recuperação
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/onboarding/client/${client.id}`)}
            className={btnClass}
          >
            <Rocket className="h-4 w-4 mr-2" /> Onboarding
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/clients")}
            className="rounded-xl text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl !bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                <ClientAvatar avatarUrl={client.avatar_url} clientName={client.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-medium">
                    <Building2 className="h-3 w-3 mr-1" />
                    {getBusinessTypeLabel(client.business_type)}
                  </Badge>
                  {placeId && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                      <Check className="h-3 w-3 mr-1" /> Google Vinculado
                    </Badge>
                  )}
                  {snapshot.business_status && statusLabels[snapshot.business_status] && (
                    <Badge className={`${statusLabels[snapshot.business_status].color} font-medium`}>
                      {statusLabels[snapshot.business_status].label}
                    </Badge>
                  )}
                </div>
                {displayAddress && (
                  <p className="text-sm text-slate-500 mt-2 flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /> {displayAddress}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Overview + Hours */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold">Visão Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Nome" value={displayName} />
                {(snapshot.types?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Categorias</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {snapshot.types!.slice(0, 6).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-xs border-slate-200 text-slate-600 bg-slate-50"
                        >
                          {formatType(t)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <InfoRow label="Endereço" value={displayAddress} icon={<MapPin className="h-4 w-4" />} />
                <InfoRow
                  label="Telefone"
                  value={snapshot.formatted_phone_number || snapshot.international_phone_number}
                  icon={<Phone className="h-4 w-4" />}
                />
                {snapshot.website && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Website</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <a
                        href={snapshot.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {snapshot.website}
                      </a>
                      <ExternalLink className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    </div>
                  </div>
                )}
                {mapsUrl && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Google Maps</span>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Abrir no Google Maps
                      </a>
                      <ExternalLink className="h-3 w-3 text-blue-400" />
                    </div>
                  </div>
                )}
                {placeId && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Place ID</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded font-mono text-slate-700 truncate max-w-xs">
                        {placeId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600"
                        onClick={() => copyToClipboard(placeId, "placeId")}
                      >
                        {copiedField === "placeId" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snapshot.opening_hours?.weekday_text && snapshot.opening_hours.weekday_text.length > 0 ? (
                  <div className="space-y-1">
                    {snapshot.opening_hours.weekday_text.map((line, i) => (
                      <p key={i} className="text-sm text-slate-700">
                        {translateWeekdayLine(line)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Não disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Avaliações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snapshot.rating !== undefined && (
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                      <span className="text-2xl font-bold text-slate-900">{snapshot.rating?.toFixed(1)}</span>
                    </div>
                    {snapshot.user_ratings_total !== undefined && (
                      <span className="text-sm text-slate-500">
                        ({snapshot.user_ratings_total.toLocaleString("pt-BR")} avaliações)
                      </span>
                    )}
                  </div>
                )}
                {snapshot.reviews && snapshot.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {snapshot.reviews.slice(0, 3).map((review, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-800">{review.author_name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${s < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.text && <p className="text-sm text-slate-600 line-clamp-3">{review.text}</p>}
                        {review.relative_time_description && (
                          <p className="text-xs text-slate-400 mt-1">{review.relative_time_description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400 italic mb-2">Nenhuma avaliação sincronizada</p>
                    {placeId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs"
                        onClick={handleSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Sincronizar avaliações
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Indicators + Photos */}
          <div className="space-y-6">
            {/* Indicators */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold">Indicadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {snapshot.rating !== undefined ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avaliação</span>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-bold text-slate-900">{snapshot.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sem avaliação disponível</p>
                )}
                {snapshot.user_ratings_total !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total de avaliações</span>
                    <span className="text-lg font-bold text-slate-900">
                      {snapshot.user_ratings_total?.toLocaleString("pt-BR")}
                    </span>
                  </div>
                )}
                {snapshot.business_status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge
                      className={`${statusLabels[snapshot.business_status]?.color || "bg-slate-100 text-slate-600"} font-medium text-xs`}
                    >
                      {statusLabels[snapshot.business_status]?.label || snapshot.business_status}
                    </Badge>
                  </div>
                )}
                {!hasSnapshot && (
                  <p className="text-sm text-slate-400 italic">Vincule um Place ID para ver indicadores do Google.</p>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold">Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                {!placeId ? (
                  <div className="text-center py-6 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-2">Conecte o Google Places para carregar fotos</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => navigate("/clients")}
                    >
                      <MapPin className="h-3 w-3 mr-1" /> Conectar
                    </Button>
                  </div>
                ) : snapshot.photo_urls && snapshot.photo_urls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {snapshot.photo_urls.slice(0, 9).map((url, i) => (
                      <button
                        key={i}
                        onClick={() => !failedPhotos.has(i) && setLightboxUrl(url)}
                        className="aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 hover:ring-2 hover:ring-blue-300 transition-all focus:outline-none"
                      >
                        {failedPhotos.has(i) ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-slate-400">Erro</span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Foto ${i + 1} de ${displayName}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setFailedPhotos((prev) => new Set(prev).add(i))}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ) : snapshot.photos && snapshot.photos.some((p) => p.url) ? (
                  <div className="grid grid-cols-3 gap-2">
                    {snapshot.photos
                      .filter((p) => p.url)
                      .slice(0, 9)
                      .map((photo, i) => {
                        const idx = i + 100;
                        return (
                          <button
                            key={i}
                            onClick={() => !failedPhotos.has(idx) && setLightboxUrl(photo.url!)}
                            className="aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 hover:ring-2 hover:ring-blue-300 transition-all focus:outline-none"
                          >
                            {failedPhotos.has(idx) ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-slate-400">Erro</span>
                              </div>
                            ) : (
                              <img
                                src={photo.url!}
                                alt={`Foto ${i + 1} de ${displayName}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => setFailedPhotos((prev) => new Set(prev).add(idx))}
                              />
                            )}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-6 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-2">Nenhuma foto pública encontrada</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Sincronizar fotos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card className="!bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 text-base font-bold">Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {placeId && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Place ID</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded font-mono text-slate-700 truncate max-w-[180px]">
                        {placeId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600"
                        onClick={() => copyToClipboard(placeId, "placeId2")}
                      >
                        {copiedField === "placeId2" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Última atualização</span>
                  <p className="text-sm text-slate-700 mt-1">
                    {new Date(client.updated_at || client.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Photo Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={lightboxUrl}
                alt="Foto ampliada"
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-sm text-slate-700">{value}</span>
      </div>
    </div>
  );
}
