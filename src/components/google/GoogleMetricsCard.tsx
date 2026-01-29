import { useEffect, useState } from "react";
import { 
  Eye, 
  Phone, 
  Navigation, 
  Globe, 
  MessageSquare,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoogleMetrics, type AggregatedMetrics } from "@/hooks/useGoogleMetrics";
import { useGoogleConnection, type ClientGoogleLocation } from "@/hooks/useGoogleConnection";

interface GoogleMetricsCardProps {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  compact?: boolean;
}

export function GoogleMetricsCard({ 
  clientId, 
  startDate, 
  endDate,
  compact = false,
}: GoogleMetricsCardProps) {
  const { fetchMetrics, getAggregatedMetrics, isLoading } = useGoogleMetrics(clientId);
  const { getClientLocation } = useGoogleConnection();
  const [location, setLocation] = useState<ClientGoogleLocation | null>(null);
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingLocation(true);
      const loc = await getClientLocation(clientId);
      setLocation(loc);
      
      if (loc) {
        await fetchMetrics(startDate, endDate);
      }
      setIsLoadingLocation(false);
    };
    
    loadData();
  }, [clientId, startDate, endDate, getClientLocation, fetchMetrics]);

  useEffect(() => {
    if (location) {
      setMetrics(getAggregatedMetrics(startDate, endDate));
    }
  }, [location, startDate, endDate, getAggregatedMetrics]);

  if (isLoadingLocation || isLoading) {
    return (
      <Card className={compact ? "bg-secondary/30" : ""}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!location) {
    return null; // No Google Business linked
  }

  if (compact) {
    return (
      <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-500">Google Business</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{metrics?.views || 0}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div>
            <p className="text-lg font-bold">{metrics?.calls || 0}</p>
            <p className="text-xs text-muted-foreground">Ligações</p>
          </div>
          <div>
            <p className="text-lg font-bold">{metrics?.directions || 0}</p>
            <p className="text-xs text-muted-foreground">Rotas</p>
          </div>
          <div>
            <p className="text-lg font-bold">{metrics?.websiteClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Cliques</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Métricas do Google Business
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{metrics?.views || 0}</p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Phone className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{metrics?.calls || 0}</p>
            <p className="text-xs text-muted-foreground">Ligações</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Navigation className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{metrics?.directions || 0}</p>
            <p className="text-xs text-muted-foreground">Rotas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Globe className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{metrics?.websiteClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Cliques Site</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <MessageSquare className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{metrics?.messages || 0}</p>
            <p className="text-xs text-muted-foreground">Mensagens</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Vinculado: {location.location_title}
        </p>
      </CardContent>
    </Card>
  );
}
