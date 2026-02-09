import { motion } from "framer-motion";
import { FileText, MapPin, Phone, Globe, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { useNavigate } from "react-router-dom";
import { getBusinessTypeLabel } from "@/config/plans";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface LatestReportsPanelProps {
  clients: Client[];
}

function ClientHighlightCard({ client }: { client: Client }) {
  const snapshot = client.place_snapshot as Record<string, any> | null;
  const rating = snapshot?.rating ?? null;
  const totalRatings = snapshot?.user_ratings_total ?? null;

  return (
    <div className="space-y-4">
      {/* Cover / Avatar area */}
      <div className="relative rounded-xl bg-muted h-32 flex items-center justify-center overflow-hidden">
        {(client as any).avatar_url ? (
          <img
            src={(client as any).avatar_url}
            alt={client.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
            {client.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-base">{client.name}</h3>
        <p className="text-xs text-muted-foreground capitalize">{getBusinessTypeLabel(client.business_type)}</p>
        {rating && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-lg font-bold">{rating}</span>
            <Star className="h-4 w-4 text-warning fill-warning" />
            {totalRatings && (
              <span className="text-xs text-muted-foreground">({totalRatings})</span>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2.5 text-sm">
        {client.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <span className="text-xs">{client.address}</span>
          </div>
        )}
        {client.google_maps_url && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <a
              href={client.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate"
            >
              Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function LatestReportsPanel({ clients }: LatestReportsPanelProps) {
  const navigate = useNavigate();
  const featuredClient = clients[0] ?? null;

  return (
    <motion.div
      className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg font-display">Últimos Relatórios</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Ver
        </Button>
      </div>

      <div className="p-5">
        {featuredClient ? (
          <ClientHighlightCard client={featuredClient} />
        ) : (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sem relatórios ainda</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/reports")}>
              Gerar Relatório
            </Button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {featuredClient && (
        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/clients")}>
            Clientes
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/reports")}>
            Relatórios
          </Button>
        </div>
      )}
    </motion.div>
  );
}
