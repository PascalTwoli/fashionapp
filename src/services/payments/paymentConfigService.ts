import { supabase } from "@/integrations/supabase/client";
import type { PaymentProvider, PaymentMethodCode } from "@/types/payments";

export const getEnabledProviders = async (): Promise<PaymentProvider[]> => {
  const { data, error } = await (supabase as any)
    .from("payment_providers")
    .select("*")
    .eq("enabled", true)
    .order("sort_order");

  if (error || !data) return [];
  return data as PaymentProvider[];
};

export const getAllProviders = async (): Promise<PaymentProvider[]> => {
  const { data, error } = await (supabase as any)
    .from("payment_providers")
    .select("*")
    .order("sort_order");

  if (error || !data) return [];
  return data as PaymentProvider[];
};

export const updateProviderEnabled = async (
  providerCode: string,
  enabled: boolean
): Promise<void> => {
  const { error } = await (supabase as any)
    .from("payment_providers")
    .update({ enabled })
    .eq("provider_code", providerCode);

  if (error) throw new Error(error.message);

  // Keep platform_settings.enabled_payment_methods in sync
  const providers = await getAllProviders();
  const enabledCodes: PaymentMethodCode[] = providers
    .map((p) => p.provider_code === providerCode ? { ...p, enabled } : p)
    .filter((p) => p.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.provider_code);

  const { error: syncErr } = await (supabase as any)
    .from("platform_settings")
    .update({ value: enabledCodes })
    .eq("key", "enabled_payment_methods");

  if (syncErr) throw new Error(`Provider updated but settings sync failed: ${syncErr.message}`);
};
