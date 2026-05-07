import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useMemo,
} from "react";

/**
 * CartItem represents a unique product variant in the shopping cart
 * id: Unique identifier for this cart entry (not product_id)
 * product_id: The product this item refers to
 * variant_id: The specific variant (size/color combination)
 * size & color: Identify the specific variant
 */
interface CartItem {
	id: string; // Unique cart entry ID
	product_id: string; // Product identifier
	variant_id?: string; // Product variant ID for inventory tracking
	name: string;
	price: number;
	image: string;
	size: string;
	color: string;
	quantity: number;
}

interface CartContextType {
	items: CartItem[];
	addToCart: (item: Omit<CartItem, "id" | "quantity">) => void;
	removeFromCart: (cartItemId: string) => void;
	updateQuantity: (cartItemId: string, quantity: number) => void;
	clearCart: () => void;
	totalPrice: number;
	totalItems: number;
	isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key
const CART_STORAGE_KEY = "fashionup_cart";

/**
 * Generate a unique ID for a cart entry
 * Combines product_id, size, and color to create a unique identifier
 */
export const generateCartItemId = (
	product_id: string,
	size: string,
	color: string,
): string => {
	return `${product_id}-${size}-${color}`;
};

/**
 * Safely parse cart from localStorage
 * Returns empty array if parsing fails or data is corrupted
 */
const loadCartFromStorage = (): CartItem[] => {
	try {
		const stored = localStorage.getItem(CART_STORAGE_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);

		// Validate the structure
		if (!Array.isArray(parsed)) {
			console.warn("Cart storage is corrupted, returning empty cart");
			return [];
		}

		// Basic validation of cart items
		const validItems = parsed.filter(
			(item) =>
				item.id &&
				item.product_id &&
				item.name &&
				typeof item.price === "number" &&
				item.image &&
				item.size &&
				item.color &&
				typeof item.quantity === "number" &&
				item.quantity >= 1,
		);

		return validItems;
	} catch (error) {
		console.error("Failed to load cart from localStorage:", error);
		return [];
	}
};

/**
 * Save cart to localStorage
 */
const saveCartToStorage = (items: CartItem[]): void => {
	try {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
	} catch (error) {
		console.error("Failed to save cart to localStorage:", error);
	}
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Initialize cart from localStorage on mount
	useEffect(() => {
		const loadedCart = loadCartFromStorage();
		setItems(loadedCart);
		setIsLoading(false);
	}, []);

	// Sync cart to localStorage whenever it changes
	useEffect(() => {
		if (!isLoading) {
			saveCartToStorage(items);
		}
	}, [items, isLoading]);

	const addToCart = (newItem: Omit<CartItem, "id" | "quantity">) => {
		// Validate input - check all required fields are present
		if (
			!newItem.product_id ||
			!newItem.name ||
			typeof newItem.price !== "number" ||
			!newItem.image ||
			!newItem.size ||
			!newItem.color
		) {
			console.warn("Invalid item data for addToCart:", newItem);
			return;
		}

		setItems((prevItems) => {
			// Generate cart ID based on product variant
			const cartItemId = generateCartItemId(
				newItem.product_id,
				newItem.size,
				newItem.color,
			);

			// Check if this variant already exists
			const existingItemIndex = prevItems.findIndex(
				(item) => item.id === cartItemId,
			);

			if (existingItemIndex > -1) {
				// Item exists: increment quantity
				const updatedItems = [...prevItems];
				updatedItems[existingItemIndex].quantity += 1;
				return updatedItems;
			} else {
				// New item: add to cart with quantity 1
				return [
					...prevItems,
					{
						...newItem,
						id: cartItemId,
						quantity: 1,
					},
				];
			}
		});
	};

	const removeFromCart = (cartItemId: string) => {
		setItems((prevItems) =>
			prevItems.filter((item) => item.id !== cartItemId),
		);
	};

	const updateQuantity = (cartItemId: string, quantity: number) => {
		// Validate quantity
		if (!Number.isInteger(quantity) || quantity < 1) {
			console.warn("Invalid quantity:", quantity);
			return;
		}

		setItems((prevItems) =>
			prevItems.map((item) =>
				item.id === cartItemId ? { ...item, quantity } : item,
			),
		);
	};

	const clearCart = () => {
		setItems([]);
	};

	// Memoize derived values to prevent unnecessary recalculations
	const { totalPrice, totalItems } = useMemo(() => {
		const price = items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0,
		);
		const count = items.reduce((sum, item) => sum + item.quantity, 0);
		return { totalPrice: price, totalItems: count };
	}, [items]);

	const value: CartContextType = {
		items,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		totalPrice,
		totalItems,
		isLoading,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
