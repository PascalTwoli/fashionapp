/**
 * Inventory operations for variant-based stock management
 */

import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { ProductVariant } from "@/types/product";

export interface InventoryCheckResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Validate that all cart items have available inventory
 */
export const validateCheckoutInventory = async (
	cartItems: CartItem[],
): Promise<InventoryCheckResult> => {
	const errors: string[] = [];

	for (const item of cartItems) {
		try {
			// If item has variant_id, check that specific variant
			if (item.variant_id) {
				const { data: variant, error } = await supabase
					.from("product_variants")
					.select("*")
					.eq("id", item.variant_id)
					.maybeSingle();

				if (error) {
					errors.push(
						`Error checking inventory for ${item.name}: ${error.message}`,
					);
					continue;
				}

				if (!variant) {
					errors.push(
						`Variant no longer available: ${item.name} (${item.color}, ${item.size})`,
					);
					continue;
				}

				if (variant.stock_quantity < item.quantity) {
					errors.push(
						`Insufficient stock for ${item.name} (${item.color}, ${item.size}). Available: ${variant.stock_quantity}, Requested: ${item.quantity}`,
					);
				}
			} else {
				// Fallback: check if variant exists for size/color combo
				const { data: variant, error } = await supabase
					.from("product_variants")
					.select("*")
					.eq("product_id", item.product_id)
					.eq("size", item.size)
					.eq("color", item.color)
					.maybeSingle();

				if (error) {
					errors.push(
						`Error checking inventory for ${item.name}: ${error.message}`,
					);
					continue;
				}

				if (!variant) {
					errors.push(
						`This size/color combination is no longer available: ${item.name} (${item.color}, ${item.size})`,
					);
					continue;
				}

				if (variant.stock_quantity < item.quantity) {
					errors.push(
						`Insufficient stock for ${item.name} (${item.color}, ${item.size}). Available: ${variant.stock_quantity}, Requested: ${item.quantity}`,
					);
				}
			}
		} catch (error) {
			errors.push(
				`Unexpected error validating ${item.name}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

/**
 * Reduce stock for a variant after successful order
 */
export const reduceVariantStock = async (
	variantId: string,
	quantity: number,
): Promise<{ success: boolean; error?: string }> => {
	try {
		// Fetch current stock
		const { data: variant, error: fetchError } = await supabase
			.from("product_variants")
			.select("stock_quantity")
			.eq("id", variantId)
			.maybeSingle();

		if (fetchError) {
			return {
				success: false,
				error: `Failed to fetch variant: ${fetchError.message}`,
			};
		}

		if (!variant) {
			return { success: false, error: "Variant not found" };
		}

		const newStock = Math.max(0, variant.stock_quantity - quantity);

		// Update stock
		const { error: updateError } = await supabase
			.from("product_variants")
			.update({ stock_quantity: newStock })
			.eq("id", variantId);

		if (updateError) {
			return {
				success: false,
				error: `Failed to update stock: ${updateError.message}`,
			};
		}

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
};

/**
 * Reduce stock for multiple items (used after order creation)
 */
export const reduceCartItemsStock = async (
	cartItems: CartItem[],
): Promise<{ success: boolean; errors: string[] }> => {
	const errors: string[] = [];

	for (const item of cartItems) {
		let variantId = item.variant_id;

		// If no variant_id, find the variant
		if (!variantId) {
			const { data: variant } = await supabase
				.from("product_variants")
				.select("id")
				.eq("product_id", item.product_id)
				.eq("size", item.size)
				.eq("color", item.color)
				.maybeSingle();

			if (!variant) {
				errors.push(`Could not find variant for ${item.name}`);
				continue;
			}

			variantId = variant.id;
		}

		const result = await reduceVariantStock(variantId, item.quantity);
		if (!result.success) {
			errors.push(
				`Failed to reduce stock for ${item.name}: ${result.error}`,
			);
		}
	}

	return {
		success: errors.length === 0,
		errors,
	};
};
