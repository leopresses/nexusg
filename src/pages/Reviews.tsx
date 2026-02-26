import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, MessageSquare, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientReviews } from "@/hooks/useClientReviews";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { ReviewCard } from "@/components/reviews/ReviewCard";

type FilterType = "all" | "no_response" | "responded" | "critical";

interface SimpleClient {
  id: string;
  name: string;
  business_type: string;
}

export default function Reviews() {
  const { user } = useAuth();
  const { brandSettings } = useBrandSettings();
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState("5");
  const [newComment, setNewComment] = useState("");
  const [newDate, setNewDate] = useState("");

  const { reviews, isLoading, createReview, updateReview, deleteReview } =
    useClientReviews(selectedClientId);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const signature = brandSettings?.companyName || "Equipe Gestão Nexus";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("id, name, business_type")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setClients(data);
        if (data && data.length > 0 && !selectedClientId) {
          setSelectedClientId(data[0].id);
        }
      });
  }, [user]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === "no_response") list = list.filter((r) => !r.responded_at && !r.response_text);
    if (filter === "responded") list = list.filter((r) => !!r.responded_at);
    if (filter === "critical") list = list.filter((r) => r.rating <= 3);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.author_name?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q)
      );
    }
    // Sort: critical first, then newest
    return [...list].sort((a, b) => {
      if (a.rating <= 3 && b.rating > 3) return -1;
      if (b.rating <= 3 && a.rating > 3) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews, filter, search]);

  // KPIs
  const totalReviews = reviews.length;
  const noResponseCount = reviews.filter((r) => !r.responded_at && !r.response_text).length;
  const criticalCount = reviews.filter((r) => r.rating <= 3).length;

  const handleAdd = async () => {
    if (!selectedClientId || !newComment.trim()) return;
    await createReview({
      client_id: selectedClientId,
      author_name: newAuthor,
      rating: parseInt(newRating),
      comment: newComment,
      review_date: newDate || undefined,
    });
    setShowAddDialog(false);
    setNewAuthor("");
    setNewRating("5");
    setNewComment("");
    setNewDate("");
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "no_response", label: "Sem resposta" },
    { value: "responded", label: "Respondidas" },
    { value: "critical", label: "Críticas (≤3)" },
  ];

  return (
    <AppLayout title="Avaliações" subtitle="Gerencie avaliações dos seus clientes">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalReviews}</p>
                <p className="text-xs text-slate-500">Total de avaliações</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{noResponseCount}</p>
                <p className="text-xs text-slate-500">Sem resposta</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <Star className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{criticalCount}</p>
                <p className="text-xs text-slate-500">Críticas (≤3★)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedClientId || ""}
            onValueChange={(v) => setSelectedClientId(v)}
          >
            <SelectTrigger className="w-full sm:w-64 !bg-white border-slate-200 text-slate-900">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent className="bg-white text-slate-900 border-slate-200">
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por autor ou texto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 !bg-white border-slate-200"
            />
          </div>

          <Button onClick={() => setShowAddDialog(true)} disabled={!selectedClientId}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={filter !== f.value ? "!bg-white border-slate-200 text-slate-700" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Reviews list */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Carregando...</div>
        ) : !selectedClientId ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center text-slate-500">
              Selecione um cliente para ver as avaliações.
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center text-slate-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Nenhuma avaliação encontrada</p>
              <p className="text-sm mt-1">Adicione avaliações manualmente ou importe do Google.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                clientName={selectedClient?.name || ""}
                signature={signature}
                onUpdate={updateReview}
                onDelete={deleteReview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Review Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>Adicionar Avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome do autor</label>
              <Input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Ex: João Silva"
                className="!bg-white border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nota</label>
              <Select value={newRating} onValueChange={setNewRating}>
                <SelectTrigger className="!bg-white border-slate-200 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Comentário</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Texto da avaliação..."
                className="!bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Data (opcional)</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="!bg-white border-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="!bg-white border-slate-200">
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!newComment.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
