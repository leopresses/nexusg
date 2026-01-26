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
        setBrandSettings({
          companyName: defaultBrandSettings.companyName,
          logo: data.logo_url,
          primaryColor: data.primary_color || defaultBrandSettings.primaryColor,
          secondaryColor: data.secondary_color || defaultBrandSettings.secondaryColor,
          accentColor: data.accent_color || defaultBrandSettings.accentColor,
          reportFooter: defaultBrandSettings.reportFooter,
        });
      }
    } catch (error) {
      console.error('Error fetching brand settings:', error);
    } finally {
      setIsLoading(false);
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
    updateBrandSettings,
    refetch: fetchBrandSettings,
  };
}
