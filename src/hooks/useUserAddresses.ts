/**
 * useUserAddresses Hook
 * Manage user's saved shipping addresses
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface UserAddress {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address: string;
  address_2?: string;
  city: string;
  county: string;
  country: string;
  postcode?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all addresses for current user
 */
export const useUserAddresses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

/**
 * Add new address
 */
export const useAddAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (address: Omit<UserAddress, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_addresses")
        .insert({
          ...address,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });
};

/**
 * Update address
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      ...address
    }: Partial<UserAddress> & { id: string }) => {
      const { data, error } = await supabase
        .from("user_addresses")
        .update(address)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });
};

/**
 * Delete address
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });
};

/**
 * Set default address
 */
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, unset all default addresses for this user
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      // Then set the new default
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });
};

/**
 * Get default address or first address
 */
export const useDefaultAddress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["default-address", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!user?.id,
  });
};
