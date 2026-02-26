import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ClipboardCheck, Loader2, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel } from "@/config/plans";
import { computeClientAudit, getClassificationColor, getScoreColor, getProgressColor } from "@/lib/auditScore";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function Audit() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("clients").select("*").order("name");
      setClients(data || []);
      setIsLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  if (isLoading) {
    return (
      <AppLayout title="Auditoria do Perfil" subtitle="Avalie a qualidade do perfil Google dos seus clientes">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando clientes…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Auditoria do Perfil" subtitle="Avalie a qualidade do perfil Google dos seus clientes">
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 shadow-sm focus-visible:ring-blue-600 placeholder:text-slate-500"
          />
        </div>

        {filtered.length === 0 ? (
          <motion.div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ClipboardCheck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-slate-900">
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Ajuste sua busca."
                : "Cadastre clientes para começar a auditar seus perfis."}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate("/onboarding")} className="rounded-xl shadow-md font-bold">
                Adicionar Cliente
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {filtered.map((client, i) => {
              const audit = computeClientAudit({
                place_id: (client as any).place_id,
                name: client.name,
                address: client.address,
                place_snapshot: (client as any).place_snapshot,
              });

              return (
                <motion.div
                  key={client.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/audit/${client.id}`)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="h-3 w-3" />
                        <span className="capitalize">{getBusinessTypeLabel(client.business_type)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${getScoreColor(audit.score)}`}>
                        {audit.score}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/100</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${getClassificationColor(audit.classification)}`}>
                      {audit.classification}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(audit.score)}`}
                      style={{ width: `${audit.score}%` }}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-xl text-blue-600 hover:bg-blue-50 font-semibold text-xs"
                  >
                    Ver auditoria <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
