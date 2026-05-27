import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateProductSlug } from '@/lib/shareUtils';

/**
 * Hook to resolve a product by either ID or slug
 * Useful for deep linking where users share clean URLs (slug-based)
 * but system uses UUIDs
 */
export const useProductByIdOrSlug = (idOrSlug?: string) => {
  return useQuery({
    queryKey: ['product-by-id-or-slug', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      // First, try to fetch by direct ID (UUID)
      const { data: byId, error: idError } = await supabase
        .from('products')
        .select('*')
        .eq('id', idOrSlug)
        .single();

      if (byId && !idError) {
        return byId;
      }

      // If not found by ID, try to find by slug
      // Fetch all products and filter by generated slug
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError || !allProducts) {
        throw new Error(`Product not found: ${idOrSlug}`);
      }

      // Find product by matching generated slug with the provided idOrSlug
      const product = allProducts.find(
        (p) => generateProductSlug(p.name) === idOrSlug,
      );

      if (!product) {
        throw new Error(`Product not found: ${idOrSlug}`);
      }

      return product;
    },
    enabled: !!idOrSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
