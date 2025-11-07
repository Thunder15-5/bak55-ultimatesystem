import { supabase } from "@/integrations/supabase/client";

export const useFanActivity = () => {
  const trackActivity = async (activityType: string, metadata?: any) => {
    try {
      await supabase.functions.invoke('track-fan-activity', {
        body: { activityType, metadata }
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  return { trackActivity };
};
