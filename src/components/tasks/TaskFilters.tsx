import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterClient: string;
  onClientChange: (value: string) => void;
  clients: Client[];
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterClient,
  onClientChange,
  clients,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 shadow-sm
          focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />

        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px] h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 shadow-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          {/* Ajustado: SelectContent forçado para branco */}
          <SelectContent className="!bg-white border border-slate-200 rounded-xl shadow-lg">
            {/* Ajustado: !text-slate-900 garante que o texto apareça em preto sem depender do hover */}
            <SelectItem value="all" className="!text-slate-900 focus:bg-slate-100">
              Todos os status
            </SelectItem>
            <SelectItem value="pending" className="!text-slate-900 focus:bg-slate-100">
              Pendente
            </SelectItem>
            <SelectItem value="in_progress" className="!text-slate-900 focus:bg-slate-100">
              Em progresso
            </SelectItem>
            <SelectItem value="completed" className="!text-slate-900 focus:bg-slate-100">
              Concluída
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterClient} onValueChange={onClientChange}>
          <SelectTrigger className="w-[180px] h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 shadow-sm">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent className="!bg-white border border-slate-200 rounded-xl shadow-lg">
            <SelectItem value="all" className="!text-slate-900 focus:bg-slate-100">
              Todos os clientes
            </SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id} className="!text-slate-900 focus:bg-slate-100">
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
