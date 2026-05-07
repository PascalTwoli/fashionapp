/**
 * Product variant types for size/color-based inventory
 */

export interface ProductVariant {
	id: string;
	product_id: string;
	size: string;
	color: string;
	stock_quantity: number;
	sku?: string;
	price_override?: number;
	created_at?: string;
	updated_at?: string;
}

export interface ProductVariantInput {
	size: string;
	color: string;
	stock_quantity: number;
	sku?: string;
	price_override?: number;
}

export interface CartItemVariant {
	product_id: string;
	variant_id: string;
	name: string;
	price: number;
	image: string;
	size: string;
	color: string;
	quantity: number;
	product_snapshot?: {
		id: string;
		name: string;
		brand?: string;
		category?: string;
	};
}
