import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserPreferences {
  soundEnabled: boolean;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    soundEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          soundEnabled: data.sound_enabled,
        });
      } else {
        // Create default preferences if they don't exist
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, sound_enabled: true });

        if (insertError) {
          console.error("Error creating preferences:", insertError);
        }
      }
    } catch (error) {
      console.error("Error in fetchPreferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updateSoundEnabled = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          sound_enabled: enabled,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, soundEnabled: enabled }));
    } catch (error) {
      console.error("Error updating sound preference:", error);
    }
  };

  const playStatusChangeSound = useCallback(() => {
    if (!preferences.soundEnabled) return;

    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [preferences.soundEnabled]);

  return {
    preferences,
    isLoading,
    updateSoundEnabled,
    playStatusChangeSound,
  };
}
