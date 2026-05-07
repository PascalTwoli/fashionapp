import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductVariant } from "@/types/product";

/**
 * Fetch all variants for a specific product
 */
export const useProductVariants = (productId?: string) => {
	return useQuery({
		queryKey: ["product-variants", productId],
		queryFn: async (): Promise<ProductVariant[]> => {
			if (!productId) return [];

			try {
				const { data, error } = await supabase
					.from("product_variants")
					.select("*")
					.eq("product_id", productId)
					.order("color")
					.order("size");

				if (error) {
					console.error("Error fetching product variants:", error);
					return [];
				}

				return data || [];
			} catch (error) {
				console.error("Failed to fetch product variants:", error);
				return [];
			}
		},
		enabled: !!productId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

/**
 * Fetch a specific variant by ID
 */
export const useProductVariant = (variantId?: string) => {
	return useQuery({
		queryKey: ["product-variant", variantId],
		queryFn: async (): Promise<ProductVariant | null> => {
			if (!variantId) return null;

			try {
				const { data, error } = await supabase
					.from("product_variants")
					.select("*")
					.eq("id", variantId)
					.maybeSingle();

				if (error) {
					console.error("Error fetching variant:", error);
					return null;
				}

				return data || null;
			} catch (error) {
				console.error("Failed to fetch variant:", error);
				return null;
			}
		},
		enabled: !!variantId,
		staleTime: 1000 * 60 * 5,
	});
};

/**
 * Fetch variants by product ID and get available sizes/colors
 */
export const useVariantAvailability = (productId?: string) => {
	return useQuery({
		queryKey: ["variant-availability", productId],
		queryFn: async () => {
			if (!productId) return { colors: [], sizes: {} };

			try {
				const { data: variants, error } = await supabase
					.from("product_variants")
					.select("size, color, stock_quantity")
					.eq("product_id", productId)
					.gt("stock_quantity", 0);

				if (error) {
					console.error("Error fetching variant availability:", error);
					return { colors: [], sizes: {} };
				}

				// Extract unique colors and map sizes per color
				const colorSet = new Set<string>();
				const sizesByColor: Record<string, Set<string>> = {};

				(variants || []).forEach((v: any) => {
					colorSet.add(v.color);
					if (!sizesByColor[v.color]) {
						sizesByColor[v.color] = new Set();
					}
					sizesByColor[v.color].add(v.size);
				});

				return {
					colors: Array.from(colorSet).sort(),
					sizes: Object.fromEntries(
						Object.entries(sizesByColor).map(([color, sizes]) => [
							color,
							Array.from(sizes).sort(),
						]),
					),
				};
			} catch (error) {
				console.error("Failed to fetch variant availability:", error);
				return { colors: [], sizes: {} };
			}
		},
		enabled: !!productId,
		staleTime: 1000 * 60 * 5,
	});
};
