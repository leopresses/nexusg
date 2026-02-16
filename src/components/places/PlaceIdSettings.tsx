import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";

export function PlaceIdSettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle>Dados Públicos do Google (Places)</CardTitle>
            <CardDescription>Vincule dados do Google Places aos seus clientes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <h4 className="font-medium text-sm">Como funciona</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Ao cadastrar ou editar um cliente, você pode vincular um Place ID do Google.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              O sistema busca dados públicos como nome, endereço, avaliações e fotos.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              Os dados são armazenados localmente e atualizados a cada 24h.
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="font-medium text-sm mb-2">Onde encontrar o Place ID?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Você pode encontrar o Place ID de qualquer negócio usando a ferramenta oficial do Google.
          </p>
          <a 
            href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Ferramenta Place ID Finder
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          A vinculação por Place ID usa dados públicos da API do Google Places e não requer autenticação OAuth.
        </p>
      </CardContent>
    </Card>
  );
}
