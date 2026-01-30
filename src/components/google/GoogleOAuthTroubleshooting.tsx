import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TroubleshootingItem {
  code: string;
  title: string;
  cause: string;
  solution: string;
  severity: "critical" | "warning" | "info";
}

const troubleshootingItems: TroubleshootingItem[] = [
  {
    code: "redirect_uri_mismatch",
    title: "Redirect URI Mismatch",
    cause: "A URI de redirecionamento configurada no Google Cloud Console não corresponde exatamente à usada pelo sistema.",
    solution: "Adicione exatamente: https://nnzhffvfeibfippnayyq.supabase.co/functions/v1/google-auth-callback em APIs & Services > Credentials > OAuth 2.0 Client > Authorized redirect URIs",
    severity: "critical",
  },
  {
    code: "invalid_client",
    title: "Invalid Client / Secret Mismatch",
    cause: "O GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET configurado está incorreto ou pertence a outro projeto.",
    solution: "Verifique se as credenciais nos Secrets do Supabase correspondem exatamente às do OAuth Client no Google Cloud Console.",
    severity: "critical",
  },
  {
    code: "access_denied",
    title: "Access Denied / Consent Denied",
    cause: "O usuário recusou as permissões durante o consentimento OAuth, ou a conta não está autorizada (modo de teste).",
    solution: "Se o app está em Testing mode no Google Cloud, adicione o email do usuário como Test User no OAuth consent screen.",
    severity: "warning",
  },
  {
    code: "invalid_grant",
    title: "Invalid Grant / Code Expired",
    cause: "O código de autorização expirou (limite de alguns segundos) ou já foi utilizado.",
    solution: "O usuário deve tentar conectar novamente. Se persistir, verifique se há delays na rede ou múltiplos cliques.",
    severity: "warning",
  },
  {
    code: "state_expired",
    title: "State Expired (10 min timeout)",
    cause: "O usuário demorou mais de 10 minutos entre iniciar e completar o fluxo OAuth.",
    solution: "Instrua o usuário a completar o login no Google rapidamente após clicar em Conectar.",
    severity: "info",
  },
  {
    code: "missing_params",
    title: "Missing Code/State Parameters",
    cause: "O Google redirecionou para o callback sem os parâmetros necessários, ou houve erro de parsing da URL.",
    solution: "Verifique os logs da edge function google-auth-callback para detalhes. Pode indicar problema na configuração do OAuth.",
    severity: "critical",
  },
  {
    code: "config_error",
    title: "Configuration Error",
    cause: "Variáveis de ambiente obrigatórias não estão configuradas: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY, FRONTEND_URL.",
    solution: "Verifique os Secrets no Supabase Dashboard > Edge Functions. Todas as variáveis devem estar preenchidas.",
    severity: "critical",
  },
  {
    code: "token_exchange_failed",
    title: "Token Exchange Failed",
    cause: "A troca do authorization code por tokens falhou na API do Google.",
    solution: "Verifique se o Client Secret está correto e se as APIs necessárias estão habilitadas: Business Profile APIs (Account Management, Business Information, Performance).",
    severity: "critical",
  },
  {
    code: "database_error",
    title: "Database Error",
    cause: "Erro ao salvar os tokens no Supabase, geralmente problema de schema ou RLS.",
    solution: "Verifique se a tabela google_user_connections existe e se o Service Role Key está configurado corretamente.",
    severity: "critical",
  },
];

function getSeverityColor(severity: TroubleshootingItem["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "warning":
      return "bg-warning/20 text-warning border-warning/30";
    case "info":
      return "bg-muted text-muted-foreground border-border";
  }
}

function TroubleshootingItemCard({ item }: { item: TroubleshootingItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <code className="text-xs px-2 py-1 rounded bg-muted font-mono">
              {item.code}
            </code>
            <span className="text-sm font-medium">{item.title}</span>
          </div>
          <Badge className={getSeverityColor(item.severity)} variant="outline">
            {item.severity === "critical" ? "Crítico" : item.severity === "warning" ? "Atenção" : "Info"}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-10 pb-3 pt-2 space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Causa:</p>
          <p className="text-sm">{item.cause}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Solução:</p>
          <p className="text-sm">{item.solution}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GoogleOAuthTroubleshooting() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-dashed border-warning/50 bg-warning/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Guia de Troubleshooting (Admin)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Fechar" : "Expandir"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Erros comuns na integração Google OAuth e como resolvê-los:
          </p>
          
          <div className="space-y-2">
            {troubleshootingItems.map((item) => (
              <TroubleshootingItemCard key={item.code} item={item} />
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Links úteis:</p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Google Cloud Credentials
              </a>
              <a
                href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                OAuth Consent Screen
              </a>
              <a
                href="https://console.cloud.google.com/apis/library"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                API Library
              </a>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
