import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientAvatarUpload } from "./ClientAvatarUpload";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type BusinessType = Database["public"]["Enums"]["business_type"];

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
}

const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurante",
  store: "Loja",
  service: "Serviço",
  other: "Outro",
  cafe_service: "Café/Serviços",
  barbershop_salon: "Barbearia/Salão",
};

export function EditClientDialog({ open, onOpenChange, client, onSuccess }: EditClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("other");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setBusinessType(client.business_type);
      setAddress(client.address || "");
      setAvatarUrl((client as any).avatar_url || null);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name,
          business_type: businessType,
          address: address || null,
        })
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Erro ao atualizar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Ajustado: !bg-white e !text-slate-900 para forçar o tema claro */}
      <DialogContent className="sm:max-w-md !bg-white !text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold">Editar Cliente</DialogTitle>
          <DialogDescription className="text-slate-500">Atualize as informações do cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Avatar Upload */}
          {client && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Foto do Cliente</Label>
              <ClientAvatarUpload clientId={client.id} currentAvatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 font-medium">
              Nome do Cliente
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="!bg-white !text-slate-900 border-slate-200 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType" className="text-slate-700 font-medium">
              Tipo de Negócio
            </Label>
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger className="!bg-white !text-slate-900 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                {Object.entries(businessTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-slate-700 focus:bg-slate-100">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-slate-700 font-medium">
              Endereço (opcional)
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="!bg-white !text-slate-900 border-slate-200 focus:ring-blue-500"
              placeholder="Rua, número, cidade..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
