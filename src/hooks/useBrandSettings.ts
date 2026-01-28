import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { BrandSettings } from '@/lib/pdfGenerator';

const defaultBrandSettings: BrandSettings = {
  companyName: 'Gestão Nexus',
  logo: null,
  primaryColor: '#22c55e',
  secondaryColor: '#0a1628',
  accentColor: '#06b6d4',
  reportFooter: 'Relatório gerado por Gestão Nexus',
};

export function useBrandSettings() {
  const { user } = useAuth();
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultBrandSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBrandSettings();
    }
  }, [user]);

  const fetchBrandSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching brand settings:', error);
        return;
      }

      if (data) {
        // Get signed URL for logo if logo_url is stored
        let logoUrl: string | null = null;
        if (data.logo_url) {
          // Extract the file path from the stored URL (format: userId/logo.ext)
          const urlParts = data.logo_url.split('/brand-logos/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('brand-logos')
              .createSignedUrl(filePath, 3600); // 1 hour expiry
            
            if (!signedUrlError && signedUrlData) {
              logoUrl = signedUrlData.signedUrl;
            }
          }
        }

        setBrandSettings({
          companyName: (data as any).company_name || defaultBrandSettings.companyName,
          logo: logoUrl,
          primaryColor: data.primary_color || defaultBrandSettings.primaryColor,
          secondaryColor: data.secondary_color || defaultBrandSettings.secondaryColor,
          accentColor: data.accent_color || defaultBrandSettings.accentColor,
          reportFooter: (data as any).report_footer || defaultBrandSettings.reportFooter,
        });
      }
    } catch (error) {
      console.error('Error fetching brand settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!user) return { url: null, error: 'User not authenticated' };

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { url: null, error: 'O arquivo deve ter no máximo 2MB' };
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Formato de arquivo não suportado. Use PNG, JPG, WebP ou SVG.' };
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete existing logo if any
      await supabase.storage
        .from('brand-logos')
        .remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`, `${user.id}/logo.webp`, `${user.id}/logo.svg`]);

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { url: null, error: 'Erro ao fazer upload do arquivo' };
      }

      // Get public URL (stored in database for reference, signed URLs used for display)
      const { data: urlData } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading logo:', error);
      return { url: null, error: 'Erro ao fazer upload do arquivo' };
    } finally {
      setIsUploading(false);
    }
  };

  const deleteLogo = async (): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // List and delete all logo files for this user
      const { data: files } = await supabase.storage
        .from('brand-logos')
        .list(user.id);

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('brand-logos').remove(filesToDelete);
      }

      // Update database
      await supabase
        .from('brand_settings')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      setBrandSettings((prev) => ({ ...prev, logo: null }));
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting logo:', error);
      return { success: false, error: 'Erro ao remover logo' };
    }
  };

  const updateBrandSettings = async (newSettings: Partial<BrandSettings>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('brand_settings')
        .update({
          logo_url: newSettings.logo,
          primary_color: newSettings.primaryColor,
          secondary_color: newSettings.secondaryColor,
          accent_color: newSettings.accentColor,
          company_name: newSettings.companyName,
          report_footer: newSettings.reportFooter,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setBrandSettings((prev) => ({ ...prev, ...newSettings }));
      return { success: true };
    } catch (error) {
      console.error('Error updating brand settings:', error);
      return { error: 'Failed to update settings' };
    }
  };

  return {
    brandSettings,
    isLoading,
    isUploading,
    updateBrandSettings,
    uploadLogo,
    deleteLogo,
    refetch: fetchBrandSettings,
  };
}
