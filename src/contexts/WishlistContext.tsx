import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";

/**
 * WishlistItem represents a product saved to the user's wishlist
 * Only stores essential information needed for display and reference
 */
interface WishlistItem {
	id: string; // Product ID
	name: string;
	price: number;
	image: string;
	brand?: string; // Optional: for display in wishlist
	originalPrice?: number; // Optional: for display in wishlist
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

const WishlistContext = createContext<WishlistContextType | undefined>(
	undefined,
);

// Storage key
const WISHLIST_STORAGE_KEY = "fashionup_wishlist";

/**
 * Safely parse wishlist from localStorage
 * Returns empty array if parsing fails or data is corrupted
 */
const loadWishlistFromStorage = (): WishlistItem[] => {
	try {
		const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);

		// Validate the structure
		if (!Array.isArray(parsed)) {
			console.warn(
				"Wishlist storage is corrupted, returning empty wishlist",
			);
			return [];
		}

		// Basic validation of wishlist items
		const validItems = parsed.filter(
			(item) =>
				item.id &&
				item.name &&
				typeof item.price === "number" &&
				item.image,
		);

		return validItems;
	} catch (error) {
		console.error("Failed to load wishlist from localStorage:", error);
		return [];
	}
};

/**
 * Save wishlist to localStorage
 */
const saveWishlistToStorage = (items: WishlistItem[]): void => {
	try {
		localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
	} catch (error) {
		console.error("Failed to save wishlist to localStorage:", error);
	}
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
	const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Initialize wishlist from localStorage on mount
	useEffect(() => {
		const loadedWishlist = loadWishlistFromStorage();
		setWishlistItems(loadedWishlist);
		setIsLoading(false);
	}, []);

	// Sync wishlist to localStorage whenever it changes
	useEffect(() => {
		if (!isLoading) {
			saveWishlistToStorage(wishlistItems);
		}
	}, [wishlistItems, isLoading]);

	const addToWishlist = (item: Omit<WishlistItem, "id"> & { id?: string }) => {
		const productId = item.id || "";
		if (
			!productId ||
			!item.name ||
			typeof item.price !== "number" ||
			!item.image
		) {
			console.warn("Invalid item data for addToWishlist:", item);
			return;
		}

		setWishlistItems((prevItems) => {
			// Check if item already exists
			if (prevItems.find((wishItem) => wishItem.id === productId)) {
				return prevItems; // Item already in wishlist
			}

			// Add new item
			return [
				...prevItems,
				{
					id: productId,
					name: item.name,
					price: item.price,
					image: item.image,
					...(item.brand && { brand: item.brand }),
					...(item.originalPrice && { originalPrice: item.originalPrice }),
				},
			];
		});
	};

	const removeFromWishlist = (productId: string) => {
		setWishlistItems((prevItems) =>
			prevItems.filter((item) => item.id !== productId),
		);
	};

	const toggleWishlist = (
		item: Omit<WishlistItem, "id"> & { id?: string },
	) => {
		const productId = item.id || "";
		if (isInWishlist(productId)) {
			removeFromWishlist(productId);
		} else {
			addToWishlist(item);
		}
	};

	const isInWishlist = (productId: string): boolean => {
		return wishlistItems.some((item) => item.id === productId);
	};

	const clearWishlist = () => {
		setWishlistItems([]);
	};

	return (
		<WishlistContext.Provider
			value={{
				wishlistItems,
				addToWishlist,
				removeFromWishlist,
				toggleWishlist,
				isInWishlist,
				clearWishlist,
				isLoading,
			}}>
			{children}
		</WishlistContext.Provider>
	);
};

export const useWishlist = () => {
	const context = useContext(WishlistContext);
	if (!context) {
		throw new Error("useWishlist must be used within a WishlistProvider");
	}
	return context;
};
