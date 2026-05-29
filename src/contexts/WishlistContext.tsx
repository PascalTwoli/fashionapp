import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useRef,
} from "react";
import { supabase } from "@/integrations/supabase/client";

interface WishlistItem {
	id: string;
	name: string;
	price: number;
	image: string;
	brand?: string;
	originalPrice?: number;
}

interface WishlistContextType {
	wishlistItems: WishlistItem[];
	addToWishlist: (item: Omit<WishlistItem, "id"> & { id?: string }) => void;
	removeFromWishlist: (productId: string) => void;
	toggleWishlist: (item: Omit<WishlistItem, "id"> & { id?: string }) => void;
	isInWishlist: (productId: string) => boolean;
	clearWishlist: () => void;
	isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "fashionup_wishlist";

const loadLocal = (): WishlistItem[] => {
	try {
		const s = localStorage.getItem(WISHLIST_KEY);
		if (!s) return [];
		const parsed = JSON.parse(s);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((i) => i.id && i.name && typeof i.price === "number" && i.image);
	} catch {
		return [];
	}
};

const saveLocal = (items: WishlistItem[]) => {
	try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(items)); } catch {}
};

const clearLocal = () => {
	try { localStorage.removeItem(WISHLIST_KEY); } catch {}
};

const dbRowToWishlistItem = (row: any): WishlistItem => ({
	id: row.product_id,
	name: row.name,
	price: Number(row.price),
	image: row.image,
	...(row.brand && { brand: row.brand }),
	...(row.original_price && { originalPrice: Number(row.original_price) }),
});

const mergeItems = (dbItems: WishlistItem[], localItems: WishlistItem[]): WishlistItem[] => {
	const map = new Map<string, WishlistItem>();
	for (const item of dbItems) map.set(item.id, item);
	for (const item of localItems) {
		if (!map.has(item.id)) map.set(item.id, item);
	}
	return Array.from(map.values());
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
	const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const skipSync = useRef(false);
	const syncTimer = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUserId(session?.user?.id ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
			setUserId(session?.user?.id ?? null);
		});
		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setIsLoading(true);
			skipSync.current = true;

			if (userId) {
				try {
					const { data } = await supabase
						.from("wishlist_items")
						.select("*")
						.eq("user_id", userId);

					if (cancelled) return;

					const dbItems = (data || []).map(dbRowToWishlistItem);
					const localItems = loadLocal();
					const merged = localItems.length > 0 ? mergeItems(dbItems, localItems) : dbItems;

					setWishlistItems(merged);
					clearLocal();

					if (localItems.length > 0) {
						await syncToDb(userId, merged);
					}
				} catch (err) {
					console.error("[Wishlist] Failed to load from DB:", err);
					if (!cancelled) setWishlistItems(loadLocal());
				}
			} else {
				setWishlistItems(loadLocal());
			}

			if (!cancelled) {
				setIsLoading(false);
				setTimeout(() => { skipSync.current = false; }, 100);
			}
		};

		load();
		return () => { cancelled = true; };
	}, [userId]);

	useEffect(() => {
		if (isLoading || skipSync.current) return;

		if (userId) {
			clearTimeout(syncTimer.current);
			syncTimer.current = setTimeout(() => {
				syncToDb(userId, wishlistItems);
			}, 400);
		} else {
			saveLocal(wishlistItems);
		}

		return () => clearTimeout(syncTimer.current);
	}, [wishlistItems, userId, isLoading]);

	const addToWishlist = (item: Omit<WishlistItem, "id"> & { id?: string }) => {
		const productId = item.id || "";
		if (!productId || !item.name || typeof item.price !== "number" || !item.image) return;
		setWishlistItems((prev) => {
			if (prev.find((w) => w.id === productId)) return prev;
			return [...prev, {
				id: productId,
				name: item.name,
				price: item.price,
				image: item.image,
				...(item.brand && { brand: item.brand }),
				...(item.originalPrice && { originalPrice: item.originalPrice }),
			}];
		});
	};

	const removeFromWishlist = (productId: string) => {
		setWishlistItems((prev) => prev.filter((i) => i.id !== productId));
	};

	const toggleWishlist = (item: Omit<WishlistItem, "id"> & { id?: string }) => {
		const productId = item.id || "";
		if (isInWishlist(productId)) removeFromWishlist(productId);
		else addToWishlist(item);
	};

	const isInWishlist = (productId: string) => wishlistItems.some((i) => i.id === productId);

	const clearWishlist = () => setWishlistItems([]);

	return (
		<WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist, isLoading }}>
			{children}
		</WishlistContext.Provider>
	);
};

export const useWishlist = () => {
	const ctx = useContext(WishlistContext);
	if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
	return ctx;
};

async function syncToDb(userId: string, items: WishlistItem[]) {
	try {
		await supabase.from("wishlist_items").delete().eq("user_id", userId);
		if (items.length === 0) return;
		await supabase.from("wishlist_items").insert(
			items.map((i) => ({
				user_id: userId,
				product_id: i.id,
				name: i.name,
				price: i.price,
				image: i.image,
				brand: i.brand ?? null,
				original_price: i.originalPrice ?? null,
			})),
		);
	} catch (err) {
		console.error("[Wishlist] DB sync failed:", err);
	}
}
