import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  type: "mpesa" | "card";
  label: string;
  phone?: string;
  card_last4?: string;
  card_holder?: string;
  card_expiry?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const QK = (userId?: string) => ["payment-methods", userId];

export const useSavedPaymentMethods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK(user?.id),
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedPaymentMethod[];
    },
    enabled: !!user?.id,
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pm: Omit<SavedPaymentMethod, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .insert({ ...pm, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(user?.id) }),
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...pm }: Partial<SavedPaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .update(pm)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(user?.id) }),
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(user?.id) }),
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("saved_payment_methods")
        .update({ is_default: false })
        .eq("user_id", user?.id);
      const { error } = await supabase
        .from("saved_payment_methods")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(user?.id) }),
  });
};
