import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEnabledProviders,
  getAllProviders,
  updateProviderEnabled,
} from "@/services/payments/paymentConfigService";

export const useEnabledPaymentProviders = () =>
  useQuery({
    queryKey: ["payment-providers", "enabled"],
    queryFn: getEnabledProviders,
    staleTime: 5 * 60 * 1000,
  });

export const useAllPaymentProviders = () =>
  useQuery({
    queryKey: ["payment-providers", "all"],
    queryFn: getAllProviders,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdatePaymentProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      updateProviderEnabled(code, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-providers"] });
    },
  });
};
