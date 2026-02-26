import { useState } from "react";
import { Star, Copy, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ClientReview } from "@/hooks/useClientReviews";
import {
  getTemplatesForRating,
  fillTemplate,
} from "@/lib/reviewTemplates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReviewCardProps {
  review: ClientReview;
  clientName: string;
  signature: string;
  onUpdate: (id: string, changes: Partial<ClientReview>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ReviewCard({ review, clientName, signature, onUpdate, onDelete }: ReviewCardProps) {
  const { toast } = useToast();
  const [response, setResponse] = useState(review.response_text || "");
  const [saving, setSaving] = useState(false);

  const templates = getTemplatesForRating(review.rating);

  const handleInsertTemplate = (text: string) => {
    const filled = fillTemplate(text, review.author_name || "", clientName, signature);
    setResponse(filled);
  };

  const handleCopy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    toast({ title: "Resposta copiada!" });
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(review.id, { response_text: response });
    setSaving(false);
  };

  const handleToggleResponded = async () => {
    if (review.responded_at) {
      await onUpdate(review.id, { responded_at: null } as any);
    } else {
      await onUpdate(review.id, { responded_at: new Date().toISOString(), response_text: response });
    }
  };

  const isCritical = review.rating <= 3;
  const isResponded = !!review.responded_at;
  const noResponse = !review.response_text && !isResponded;

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">
                {review.author_name || "Anônimo"}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                  />
                ))}
              </div>
              {review.review_date && (
                <span className="text-xs text-slate-400">
                  {new Date(review.review_date).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {isCritical && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
              {isResponded && <Badge variant="success" className="text-xs">Respondida</Badge>}
              {noResponse && <Badge variant="warning" className="text-xs">Sem resposta</Badge>}
              {review.source !== "manual" && (
                <Badge variant="outline" className="text-xs capitalize">{review.source}</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-red-500 shrink-0"
            onClick={() => onDelete(review.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{review.comment}</p>
        )}

        {/* Response area */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">Resposta</label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escreva ou insira um template..."
            className="!bg-white border-slate-200 text-slate-900 min-h-[80px]"
          />
          <div className="flex flex-wrap gap-2">
            {templates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="!bg-white border-slate-200 text-slate-700">
                    Inserir template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-slate-900 border-slate-200">
                  {templates.map((t, i) => (
                    <DropdownMenuItem key={i} onClick={() => handleInsertTemplate(t.text)}>
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!response} className="!bg-white border-slate-200 text-slate-700">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar resposta"}
            </Button>
            <Button
              variant={isResponded ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleResponded}
              className={isResponded ? "" : "!bg-white border-slate-200 text-slate-700"}
            >
              {isResponded ? (
                <><Check className="h-3.5 w-3.5 mr-1" /> Desmarcar</>
              ) : (
                "Marcar respondida"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
