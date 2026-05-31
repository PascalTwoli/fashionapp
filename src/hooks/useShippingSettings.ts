import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingSettings {
  shipping_fee: number;
  free_shipping_threshold: number;
}

const DEFAULT: ShippingSettings = { shipping_fee: 500, free_shipping_threshold: 10000 };

async function fetchShippingSettings(): Promise<ShippingSettings> {
  const { data, error } = await (supabase as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["shipping_fee", "free_shipping_threshold"]);

  if (error || !data) return DEFAULT;

  const map: Record<string, number> = {};
  for (const row of data) map[row.key] = Number(row.value);

  return {
    shipping_fee:            map.shipping_fee            ?? DEFAULT.shipping_fee,
    free_shipping_threshold: map.free_shipping_threshold ?? DEFAULT.free_shipping_threshold,
  };
}

export function useShippingSettings() {
  return useQuery({
    queryKey: ["shipping-settings"],
    queryFn: fetchShippingSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ShippingSettings) => {
      const rows = [
        { key: "shipping_fee",            value: settings.shipping_fee,            description: "Standard shipping fee in KES" },
        { key: "free_shipping_threshold", value: settings.free_shipping_threshold, description: "Free shipping threshold in KES (0 = always charge)" },
      ];
      for (const row of rows) {
        // upsert handles both the "row exists" and "row missing" cases
        const { error } = await (supabase as any)
          .from("platform_settings")
          .upsert({ key: row.key, value: row.value, description: row.description }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipping-settings"] }),
  });
}

/** Pure helper — call with loaded settings. */
export function calculateShipping(subtotal: number, settings: ShippingSettings): number {
  if (subtotal === 0) return 0;
  if (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold) return 0;
  return settings.shipping_fee;
}
