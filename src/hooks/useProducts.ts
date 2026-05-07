import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
	id: string;
	name: string;
	brand?: string;
	price: number;
	discount_price?: number;
	originalPrice?: number;
	image: string;
	category?: string;
	description?: string;
	gender?: string;
	rating?: number;
	reviews?: number;
	sizes?: string[];
	colors?: string[];
	images?: string[];
	isNew?: boolean;
	status?: string;
}

/**
 * Fetch all products from Supabase
 */
export const useAllProducts = () => {
	return useQuery({
		queryKey: ["products"],
		queryFn: async (): Promise<Product[]> => {
			try {
				const { data, error } = await supabase
					.from("products")
					.select("*")
					.order("created_at", { ascending: false });

				if (error) {
					console.error("Error fetching products:", error);
					return [];
				}

				// Map Supabase fields to Product interface
				return (data || []).map((item: any) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					discount_price: item.discount_price,
					image: item.image_url || "",
					category: item.category || "",
					description: item.description || "",
					// Default values for fields not yet in Supabase
					brand: item.brand || "FashionUp",
					gender: item.gender,
					originalPrice: item.original_price,
					rating: item.rating || 4.5,
					reviews: item.reviews || 0,
					sizes: item.sizes || ["XS", "S", "M", "L", "XL"],
					colors: item.colors || ["Black", "White"],
					images: item.images
						? Array.isArray(item.images)
							? item.images
							: [item.image_url]
						: [item.image_url],
					isNew: item.is_new || false,
					status: item.status || "active",
				}));
			} catch (error) {
				console.error("Failed to fetch products:", error);
				return [];
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

/**
 * Fetch products filtered by category
 */
export const useProductsByCategory = (category?: string) => {
	return useQuery({
		queryKey: ["products", "category", category],
		queryFn: async (): Promise<Product[]> => {
			try {
				let query = supabase.from("products").select("*");

				if (category && category !== "All") {
					query = query.eq("category", category);
				}

				const { data, error } = await query.order("created_at", {
					ascending: false,
				});

				if (error) {
					console.error("Error fetching products by category:", error);
					return [];
				}

				return (data || []).map((item: any) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					discount_price: item.discount_price,
					image: item.image_url || "",
					category: item.category || "",
					description: item.description || "",
					brand: item.brand || "FashionUp",
					gender: item.gender,
					originalPrice: item.original_price,
					rating: item.rating || 4.5,
					reviews: item.reviews || 0,
					sizes: item.sizes || ["XS", "S", "M", "L", "XL"],
					colors: item.colors || ["Black", "White"],
					images: item.images
						? Array.isArray(item.images)
							? item.images
							: [item.image_url]
						: [item.image_url],
					isNew: item.is_new || false,
					status: item.status || "active",
				}));
			} catch (error) {
				console.error("Failed to fetch products by category:", error);
				return [];
			}
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!category,
	});
};

/**
 * Fetch a single product by ID
 */
export const useProduct = (productId?: string) => {
	return useQuery({
		queryKey: ["product", productId],
		queryFn: async (): Promise<Product | null> => {
			if (!productId) return null;

			try {
				const { data, error } = await supabase
					.from("products")
					.select("*")
					.eq("id", productId)
					.single();

				if (error) {
					console.error("Error fetching product:", error);
					return null;
				}

				if (!data) return null;

			return {
				id: data.id,
				name: data.name,
				price: data.price,
				discount_price: data.discount_price,
				image: data.image_url || "",
				category: data.category || "",
				description: data.description || "",
				brand: data.brand || "FashionUp",
				gender: data.gender,
				originalPrice: undefined,
				rating: 4.5,
				reviews: 0,
				sizes: data.sizes || ["XS", "S", "M", "L", "XL"],
				colors: data.colors || ["Black", "White"],
				images: data.images
					? Array.isArray(data.images)
						? data.images
						: [data.image_url]
					: [data.image_url],
				isNew: false,
				status: data.status || "active",
			};
			} catch (error) {
				console.error("Failed to fetch product:", error);
				return null;
			}
		},
		staleTime: 1000 * 60 * 10, // 10 minutes for individual products
		enabled: !!productId,
	});
};

/**
 * Search products by query
 */
export const useSearchProducts = (query?: string) => {
	return useQuery({
		queryKey: ["products", "search", query],
		queryFn: async (): Promise<Product[]> => {
			if (!query || query.trim().length === 0) return [];

			try {
				const searchTerm = `%${query}%`;
				const { data, error } = await supabase
					.from("products")
					.select("*")
					.or(
						`name.ilike.${searchTerm},brand.ilike.${searchTerm},category.ilike.${searchTerm}`,
					);

				if (error) {
					console.error("Error searching products:", error);
					return [];
				}

				return (data || []).map((item: any) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					discount_price: item.discount_price,
					image: item.image_url || "",
					category: item.category || "",
					description: item.description || "",
					brand: item.brand || "FashionUp",
					gender: item.gender,
					originalPrice: item.original_price,
					rating: item.rating || 4.5,
					reviews: item.reviews || 0,
					sizes: item.sizes || ["XS", "S", "M", "L", "XL"],
					colors: item.colors || ["Black", "White"],
					images: item.images
						? Array.isArray(item.images)
							? item.images
							: [item.image_url]
						: [item.image_url],
					isNew: item.is_new || false,
					status: item.status || "active",
				}));
			} catch (error) {
				console.error("Failed to search products:", error);
				return [];
			}
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!query && query.trim().length > 0,
	});
};

/**
 * Get unique categories from products
 */
export const useCategories = () => {
	return useQuery({
		queryKey: ["categories"],
		queryFn: async (): Promise<string[]> => {
			try {
				const { data, error } = await supabase
					.from("products")
					.select("category")
					.not("category", "is", null);

				if (error) {
					console.error("Error fetching categories:", error);
					return [];
				}

				const categories = Array.from(
					new Set(
						(data || [])
							.map((item: any) => item.category)
							.filter(Boolean),
					),
				) as string[];

				return ["All", ...categories.sort()];
			} catch (error) {
				console.error("Failed to fetch categories:", error);
				return ["All"];
			}
		},
		staleTime: 1000 * 60 * 30, // 30 minutes
	});
};
