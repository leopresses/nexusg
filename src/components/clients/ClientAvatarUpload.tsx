import { useState, useEffect } from "react";
import { Loader2, Upload, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useClientAvatarUrl } from "@/hooks/useClientAvatarUrl";

interface ClientAvatarUploadProps {
  clientId: string;
  currentAvatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function ClientAvatarUpload({
  clientId,
  currentAvatarUrl,
  onAvatarChange,
}: ClientAvatarUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [internalAvatarUrl, setInternalAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const signedAvatarUrl = useClientAvatarUrl(internalAvatarUrl);

  // Sync internal state with prop
  useEffect(() => {
    setInternalAvatarUrl(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${clientId}/avatar.${fileExt}`;

      // Delete existing avatar if any
      if (currentAvatarUrl) {
        const existingPath = currentAvatarUrl.split("/client-avatars/")[1];
        if (existingPath) {
          await supabase.storage.from("client-avatars").remove([existingPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("client-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Build the storage path URL (will be converted to signed URL on display)
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storedUrl = `${baseUrl}/storage/v1/object/public/client-avatars/${fileName}`;

      // Update client record with the storage path URL
      const { error: updateError } = await supabase
        .from("clients")
        .update({ avatar_url: storedUrl })
        .eq("id", clientId);

      if (updateError) throw updateError;

      // Update internal state to trigger signed URL refresh
      setInternalAvatarUrl(storedUrl);
      onAvatarChange(storedUrl);
      toast.success("Avatar atualizado!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl || !user) return;

    setIsUploading(true);
    try {
      const existingPath = currentAvatarUrl.split("/client-avatars/")[1];
      if (existingPath) {
        await supabase.storage.from("client-avatars").remove([existingPath]);
      }

      const { error } = await supabase
        .from("clients")
        .update({ avatar_url: null })
        .eq("id", clientId);

      if (error) throw error;

      setInternalAvatarUrl(null);
      onAvatarChange(null);
      toast.success("Avatar removido!");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Erro ao remover avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : signedAvatarUrl ? (
          <img
            src={signedAvatarUrl}
            alt="Avatar"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            id={`avatar-upload-${clientId}`}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor={`avatar-upload-${clientId}`}>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={isUploading}
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
          </label>
          {internalAvatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. Max 2MB.</p>
      </div>
    </div>
  );
}
