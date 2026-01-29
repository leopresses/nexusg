import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get a signed URL for a client avatar from the private storage bucket.
 * Returns a signed URL that expires in 1 hour.
 */
export function useClientAvatarUrl(storedUrl: string | null): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      if (!storedUrl) {
        setSignedUrl(null);
        return;
      }

      // Extract the file path from the stored URL
      // Format: https://...supabase.co/storage/v1/object/public/client-avatars/userId/clientId/avatar.ext
      const urlParts = storedUrl.split("/client-avatars/");
      if (urlParts.length < 2) {
        // Not a storage URL, might be an external URL - use as-is
        setSignedUrl(storedUrl);
        return;
      }

      const filePath = urlParts[1];
      
      try {
        const { data, error } = await supabase.storage
          .from("client-avatars")
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          console.error("Error creating signed URL:", error);
          setSignedUrl(null);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Error getting signed URL:", err);
        setSignedUrl(null);
      }
    }

    getSignedUrl();
  }, [storedUrl]);

  return signedUrl;
}

/**
 * Utility function to get a signed URL for a client avatar (non-hook version).
 * Useful when you need to get the URL imperatively.
 */
export async function getClientAvatarSignedUrl(storedUrl: string | null): Promise<string | null> {
  if (!storedUrl) return null;

  const urlParts = storedUrl.split("/client-avatars/");
  if (urlParts.length < 2) {
    return storedUrl; // External URL, use as-is
  }

  const filePath = urlParts[1];

  try {
    const { data, error } = await supabase.storage
      .from("client-avatars")
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error getting signed URL:", err);
    return null;
  }
}
