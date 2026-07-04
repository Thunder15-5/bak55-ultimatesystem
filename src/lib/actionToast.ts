import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

/**
 * Unified toast messenger for primary user actions.
 * Keeps copy voice consistent and pairs feedback with haptics.
 */
export const actionToast = {
  success(title: string, description?: string) {
    haptic("success");
    toast.success(title, description ? { description } : undefined);
  },
  error(title: string, description?: string) {
    haptic("error");
    toast.error(title, description ? { description } : undefined);
  },
  info(title: string, description?: string) {
    toast(title, description ? { description } : undefined);
  },
  loading(title: string) {
    return toast.loading(title);
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
