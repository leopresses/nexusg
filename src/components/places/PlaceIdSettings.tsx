import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";

export function PlaceIdSettings() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-50 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-900 font-bold">Dados Públicos do Google (Places)</CardTitle>
            <CardDescription className="text-slate-500">
              Vincule dados do Google Places aos seus clientes
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-4">
          <h4 className="font-bold text-sm text-slate-800">Como funciona</h4>
          <ul className="text-sm text-slate-600 space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                1
              </span>
              Ao cadastrar ou editar um cliente, você pode vincular um Place ID do Google.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                2
              </span>
              O sistema busca dados públicos como nome, endereço, avaliações e fotos.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                3
              </span>
              Os dados são armazenados localmente e atualizados a cada 24h.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
          <h4 className="font-bold text-sm text-blue-900 mb-2">Onde encontrar o Place ID?</h4>
          <p className="text-sm text-blue-800/80 mb-4 leading-relaxed">
            Você pode encontrar o Place ID de qualquer negócio usando a ferramenta oficial do Google.
          </p>
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            Ferramenta Place ID Finder
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-2 p-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <p className="text-xs text-slate-400 font-medium">
            A vinculação usa dados públicos da API do Google Places e não requer autenticação OAuth.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
