import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import { useNavbarVisibility } from "@/hooks/useNavbarVisibility";
import {
	useAllProducts,
	useCategories,
	useSearchProducts,
} from "@/hooks/useProducts";

const Categories = () => {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("All");

	// Scroll detection and navbar visibility
	const scrollState = useScrollDetection();
	const { isNavbarVisible, handleScroll } = useNavbarVisibility();

	// Update navbar visibility based on scroll
	React.useEffect(() => {
		handleScroll(scrollState.scrollDirection);
	}, [scrollState.scrollDirection, handleScroll]);

	// Fetch products and categories
	const { data: allProducts = [], isLoading: productsLoading } =
		useAllProducts();
	const { data: categories = [] } = useCategories();
	const { data: searchResults = [] } = useSearchProducts(query);

	// Determine which products to show
	const displayProducts = useMemo(() => {
		// If search query exists, use search results
		if (query.trim()) {
			return searchResults.filter(
				(p) =>
					p.status === "active" || p.status === "archived" || !p.status,
			);
		}

		// Filter by category
		let categoryFiltered = allProducts;
		if (activeCategory !== "All") {
			categoryFiltered = allProducts.filter(
				(p) => p.category === activeCategory,
			);
		}

		// Filter by status (show active and archived, hide draft)
		return categoryFiltered.filter(
			(p) => p.status === "active" || p.status === "archived" || !p.status,
		);
	}, [query, activeCategory, allProducts, searchResults]);

	const filtered = useMemo(
		() =>
			displayProducts.filter((p) => {
				// Additional client-side filtering if needed
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return (
					p.name.toLowerCase().includes(q) ||
					(p.brand?.toLowerCase().includes(q) ?? false) ||
					(p.category?.toLowerCase().includes(q) ?? false)
				);
			}),
		[query, displayProducts],
	);

	return (
		<div className="min-h-screen bg-background pb-24">
			<header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
				<div className="px-4 pt-4 pb-3">
					<h1 className="font-display text-2xl">Shop</h1>
					<div className="flex items-center gap-2 mt-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search products, brands…"
								className="pl-9 h-11 rounded-none border-border bg-secondary"
							/>
						</div>
						<Button
							variant="outline"
							size="icon"
							className="h-11 w-11 rounded-none border-border">
							<SlidersHorizontal className="w-4 h-4" />
						</Button>
					</div>
				</div>

				<div className="flex overflow-x-auto px-4 gap-1 pb-2">
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setActiveCategory(cat)}
							className={`shrink-0 px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
								activeCategory === cat
									? "border-foreground bg-foreground text-background"
									: "border-border text-muted-foreground hover:text-foreground"
							}`}>
							{cat}
						</button>
					))}
				</div>
			</header>

			<section className="px-4 pt-6">
				<p className="text-xs text-muted-foreground mb-4">
					{productsLoading
						? "Loading..."
						: `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
				</p>

				{productsLoading ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
						{[...Array(8)].map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="aspect-[3/4] rounded-none" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="text-center py-20">
						<p className="text-sm text-muted-foreground">
							No products match your search.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
						{filtered.map((p) => (
							<ProductCard
								key={p.id}
								{...p}
								onProductClick={(id) => navigate(`/product/${id}`)}
							/>
						))}
					</div>
				)}
			</section>

			<BottomNavigation isVisible={isNavbarVisible} />
		</div>
	);
};

export default Categories;
