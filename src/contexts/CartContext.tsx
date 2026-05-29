import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useRef,
	useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
	id: string;
	product_id: string;
	variant_id?: string;
	name: string;
	price: number;
	image: string;
	size: string;
	color: string;
	quantity: number;
}

interface CartContextType {
	items: CartItem[];
	addToCart: (item: Omit<CartItem, "id" | "quantity">, qty?: number) => void;
	removeFromCart: (cartItemId: string) => void;
	updateQuantity: (cartItemId: string, quantity: number) => void;
	clearCart: () => void;
	totalPrice: number;
	totalItems: number;
	isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "fashionup_cart";

export const generateCartItemId = (product_id: string, size: string, color: string) =>
	`${product_id}-${size}-${color}`;

const loadLocal = (): CartItem[] => {
	try {
		const s = localStorage.getItem(CART_KEY);
		if (!s) return [];
		const parsed = JSON.parse(s);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(i) => i.id && i.product_id && i.name && typeof i.price === "number" && i.image && i.size && i.color && typeof i.quantity === "number" && i.quantity >= 1,
		);
	} catch {
		return [];
	}
};

const saveLocal = (items: CartItem[]) => {
	try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
};

const clearLocal = () => {
	try { localStorage.removeItem(CART_KEY); } catch {}
};

const dbRowToCartItem = (row: any): CartItem => ({
	id: generateCartItemId(row.product_id, row.size, row.color),
	product_id: row.product_id,
	variant_id: row.variant_id ?? undefined,
	name: row.name,
	price: Number(row.price),
	image: row.image,
	size: row.size,
	color: row.color,
	quantity: row.quantity,
});

// Merge local items into DB items — for same variant, take the higher quantity
const mergeItems = (dbItems: CartItem[], localItems: CartItem[]): CartItem[] => {
	const map = new Map<string, CartItem>();
	for (const item of dbItems) map.set(item.id, item);
	for (const item of localItems) {
		const existing = map.get(item.id);
		if (existing) {
			map.set(item.id, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
		} else {
			map.set(item.id, item);
		}
	}
	return Array.from(map.values());
};

export const useCart = () => {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error("useCart must be used within a CartProvider");
	return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	// Prevent writing back to DB/localStorage the items we just loaded from DB
	const skipSync = useRef(false);
	// Debounce timer for DB writes
	const syncTimer = useRef<ReturnType<typeof setTimeout>>();

	// Track auth state changes using Supabase directly (avoids circular dep with AuthContext)
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUserId(session?.user?.id ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
			setUserId(session?.user?.id ?? null);
		});
		return () => subscription.unsubscribe();
	}, []);

	// Load cart whenever userId changes
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setIsLoading(true);
			skipSync.current = true;

			if (userId) {
				// Logged in: load from DB, merge any existing localStorage items
				try {
					const { data } = await supabase
						.from("cart_items")
						.select("*")
						.eq("user_id", userId);

					if (cancelled) return;

					const dbItems = (data || []).map(dbRowToCartItem);
					const localItems = loadLocal();
					const merged = localItems.length > 0 ? mergeItems(dbItems, localItems) : dbItems;

					setItems(merged);
					clearLocal(); // Local items are now in DB

					// If there were local items to merge, persist them to DB
					if (localItems.length > 0) {
						await syncToDb(userId, merged);
					}
				} catch (err) {
					console.error("[Cart] Failed to load from DB:", err);
					if (!cancelled) setItems(loadLocal());
				}
			} else {
				// Anonymous: use localStorage
				setItems(loadLocal());
			}

			if (!cancelled) {
				setIsLoading(false);
				// Small delay before re-enabling sync to avoid writing what we just read
				setTimeout(() => { skipSync.current = false; }, 100);
			}
		};

		load();
		return () => { cancelled = true; };
	}, [userId]);

	// Sync items to DB (debounced) or localStorage on every change
	useEffect(() => {
		if (isLoading || skipSync.current) return;

		if (userId) {
			clearTimeout(syncTimer.current);
			syncTimer.current = setTimeout(() => {
				syncToDb(userId, items);
			}, 400);
		} else {
			saveLocal(items);
		}

		return () => clearTimeout(syncTimer.current);
	}, [items, userId, isLoading]);

	const addToCart = (newItem: Omit<CartItem, "id" | "quantity">, qty: number = 1) => {
		if (!newItem.product_id || !newItem.name || typeof newItem.price !== "number" || !newItem.image || !newItem.size || !newItem.color) {
			console.warn("[Cart] Invalid item:", newItem);
			return;
		}
		setItems((prev) => {
			const cartItemId = generateCartItemId(newItem.product_id, newItem.size, newItem.color);
			const idx = prev.findIndex((i) => i.id === cartItemId);
			if (idx > -1) {
				const updated = [...prev];
				updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
				return updated;
			}
			return [...prev, { ...newItem, id: cartItemId, quantity: qty }];
		});
	};

	const removeFromCart = (cartItemId: string) => {
		setItems((prev) => prev.filter((i) => i.id !== cartItemId));
	};

	const updateQuantity = (cartItemId: string, quantity: number) => {
		if (!Number.isInteger(quantity) || quantity < 1) return;
		setItems((prev) => prev.map((i) => i.id === cartItemId ? { ...i, quantity } : i));
	};

	const clearCart = () => setItems([]);

	const { totalPrice, totalItems } = useMemo(() => ({
		totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
		totalItems: items.reduce((s, i) => s + i.quantity, 0),
	}), [items]);

	return (
		<CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems, isLoading }}>
			{children}
		</CartContext.Provider>
	);
};

// ─── DB helpers ────────────────────────────────────────────────────────────────

async function syncToDb(userId: string, items: CartItem[]) {
	try {
		// Delete all then re-insert is simplest and avoids partial-update edge cases
		await supabase.from("cart_items").delete().eq("user_id", userId);
		if (items.length === 0) return;
		await supabase.from("cart_items").insert(
			items.map((i) => ({
				user_id: userId,
				product_id: i.product_id,
				variant_id: i.variant_id ?? null,
				name: i.name,
				price: i.price,
				image: i.image,
				size: i.size,
				color: i.color,
				quantity: i.quantity,
			})),
		);
	} catch (err) {
		console.error("[Cart] DB sync failed:", err);
	}
}
