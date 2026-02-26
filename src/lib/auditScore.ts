// Audit Score Engine for Google Business Profile
// Computes a 0–100 score based on client data + place_snapshot

export type AuditStatus = "ok" | "missing" | "unavailable";

export interface AuditItem {
  key: string;
  label: string;
  weight: number;
  status: AuditStatus;
  tip: string;
}

export interface AuditResult {
  score: number;
  classification: "Excelente" | "Bom" | "Regular" | "Crítico";
  items: AuditItem[];
  recommendations: string[];
  availablePoints: number;
  obtainedPoints: number;
}

function getClassification(score: number): AuditResult["classification"] {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Bom";
  if (score >= 55) return "Regular";
  return "Crítico";
}

export function getClassificationColor(c: AuditResult["classification"]) {
  switch (c) {
    case "Excelente": return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "Bom": return "text-blue-700 bg-blue-50 border-blue-200";
    case "Regular": return "text-amber-700 bg-amber-50 border-amber-200";
    case "Crítico": return "text-red-700 bg-red-50 border-red-200";
  }
}

export function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 55) return "text-amber-600";
  return "text-red-600";
}

export function getProgressColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

interface ClientData {
  place_id?: string | null;
  name?: string | null;
  address?: string | null;
  place_snapshot?: any;
}

function has(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

export function computeClientAudit(client: ClientData): AuditResult {
  const snap = client.place_snapshot || {};

  const items: AuditItem[] = [];

  // Helper to add an item
  const add = (key: string, label: string, weight: number, value: any, available: boolean, tip: string) => {
    if (!available) {
      items.push({ key, label, weight, status: "unavailable", tip });
    } else {
      items.push({ key, label, weight, status: has(value) ? "ok" : "missing", tip });
    }
  };

  // 1. Place ID connected
  add("place_id", "Perfil conectado (Place ID)", 10, client.place_id, true,
    "Vincule o Google Places ID ao cliente na página de Clientes.");

  // 2. Business name
  add("name", "Nome do negócio", 5, client.name || snap.name, true,
    "Certifique-se de que o nome da empresa está preenchido no Google.");

  // 3. Address
  add("address", "Endereço completo", 8, client.address || snap.formatted_address || snap.address, true,
    "Adicione o endereço completo no perfil do Google.");

  // 4. Phone
  add("phone", "Telefone", 8, snap.formatted_phone_number || snap.international_phone_number, !!client.place_id,
    "Adicione um número de telefone válido ao perfil.");

  // 5. Website
  add("website", "Website", 8, snap.website, !!client.place_id,
    "Adicione a URL do site da empresa no perfil.");

  // 6. Opening hours
  add("hours", "Horário de funcionamento", 8, snap.opening_hours || snap.current_opening_hours, !!client.place_id,
    "Configure os horários de funcionamento no Google Business.");

  // 7. Primary category
  add("category", "Categoria principal", 8, snap.types?.[0] || snap.primary_type, !!client.place_id,
    "Defina a categoria principal do negócio no perfil.");

  // 8. Secondary categories
  add("secondary_categories", "Categorias secundárias", 4,
    (snap.types?.length > 1 ? snap.types.slice(1) : null), !!client.place_id,
    "Adicione categorias secundárias para melhorar a descoberta.");

  // 9. Description/summary
  add("description", "Descrição do negócio", 6,
    snap.editorial_summary?.overview || snap.description, !!client.place_id,
    "Escreva uma descrição detalhada com palavras-chave relevantes.");

  // 10. Photos
  const photosAvailable = !!client.place_id && snap.photos !== undefined;
  add("photos", "Fotos do perfil", 8, snap.photos, photosAvailable,
    "Adicione fotos da fachada, interior e produtos/serviços.");

  // 11. Reviews
  const reviewsAvailable = !!client.place_id && (snap.rating !== undefined || snap.user_ratings_total !== undefined);
  const reviewsOk = snap.rating && snap.rating >= 3.5 && snap.user_ratings_total && snap.user_ratings_total >= 5;
  add("reviews", "Avaliações (nota ≥ 3.5 e ≥ 5 avaliações)", 10,
    reviewsOk ? true : null, reviewsAvailable,
    "Incentive clientes a deixarem avaliações positivas.");

  // 12. Posts - usually not in place_snapshot
  add("posts", "Posts recentes", 7, null, false,
    "Publique posts regulares no perfil do Google Business.");

  // 13. Services/products
  add("services", "Serviços ou produtos cadastrados", 8, snap.serves_beer !== undefined ? true : null, false,
    "Cadastre seus serviços ou produtos no perfil.");

  // Compute score
  const available = items.filter(i => i.status !== "unavailable");
  const availablePoints = available.reduce((s, i) => s + i.weight, 0);
  const obtainedPoints = available.filter(i => i.status === "ok").reduce((s, i) => s + i.weight, 0);
  const score = availablePoints > 0 ? Math.round((obtainedPoints / availablePoints) * 100) : 0;

  // Recommendations from missing items
  const recommendations = items
    .filter(i => i.status === "missing")
    .slice(0, 5)
    .map(i => i.tip);

  return {
    score,
    classification: getClassification(score),
    items,
    recommendations,
    availablePoints,
    obtainedPoints,
  };
}
