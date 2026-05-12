import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import BottomNavigation from "@/components/BottomNavigation";
import Logo from "@/components/Logo";
import { collections } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useAllProducts, useCategories } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
	const navigate = useNavigate();
	const { totalItems } = useCart();
	const [activeCategory, setActiveCategory] = useState("New In");

	// Fetch products and categories
	const { data: allProducts = [], isLoading: productsLoading } =
		useAllProducts();
	const { data: categories = [] } = useCategories();

	// Show active products, and archived with placeholder (draft is completely hidden)
	const products = allProducts.filter(
		(p) => p.status === "active" || p.status === "archived" || !p.status,
	);

	return (
		<div className="min-h-screen bg-background overflow-hidden flex flex-col">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border z-40">
				<div className="flex items-center justify-between px-4 h-14">
					<Logo size="md" />
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Search"
							onClick={() => navigate("/categories")}>
							<Search className="w-5 h-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Notifications">
							<Bell className="w-5 h-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Bag"
							onClick={() => navigate("/cart")}
							className="relative">
							<ShoppingBag className="w-5 h-5" />
							{totalItems > 0 && (
								<span className="absolute top-1 right-1 bg-accent text-accent-foreground text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-medium">
									{totalItems}
								</span>
							)}
						</Button>
					</div>
				</div>
			</header>

		<main className="flex-1 overflow-y-auto pt-14 pb-24">
			{/* Hero */}
			<section className="relative h-[78.3vh] min-h-[400px] shrink-0 overflow-hidden">
					<img
						src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80"
						alt="Spring 2026 Collection"
						className="absolute inset-0 w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-overlay" />
					<div className="absolute bottom-0 left-0 right-0 p-6 text-background">
						<p className="text-[11px] font-medium uppercase tracking-display opacity-90">
							Spring / Summer 2026
						</p>
						<h1 className="font-display text-4xl leading-tight mt-2 max-w-[280px]">
							Effortless silhouettes, refined materials.
						</h1>
						<Button
							onClick={() => navigate("/categories")}
							className="mt-5 h-11 px-6 bg-background text-foreground hover:bg-background/90 rounded-none text-xs tracking-wider uppercase">
							Shop the Edit
						</Button>
					</div>
				</section>

				{/* Category tabs */}
				<section className="border-b border-border">
					<div className="flex overflow-x-auto scrollbar-none px-4">
						{categories.map((cat) => (
							<button
								key={cat}
								onClick={() => setActiveCategory(cat)}
								className={`relative shrink-0 px-4 py-4 text-xs uppercase tracking-wider transition-colors ${
									activeCategory === cat
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}>
								{cat}
								{activeCategory === cat && (
									<span className="absolute bottom-0 left-4 right-4 h-px bg-foreground" />
								)}
							</button>
						))}
					</div>
				</section>

				{/* Featured grid */}
				<section className="px-4 pt-8">
					<div className="flex items-end justify-between mb-6">
						<div>
							<p className="text-eyebrow">Curated</p>
							<h2 className="font-display text-2xl mt-1">Most Loved</h2>
						</div>
						<button
							onClick={() => navigate("/categories")}
							className="text-xs uppercase tracking-wider underline underline-offset-4 text-muted-foreground hover:text-foreground">
							View all
						</button>
					</div>

					{productsLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="space-y-3">
									<Skeleton className="aspect-[3/4] rounded-none" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
							{products.slice(0, 12).map((product) => (
								<ProductCard
									key={product.id}
									{...product}
									onProductClick={(id) => navigate(`/product/${id}`)}
								/>
							))}
						</div>
					)}
				</section>

				{/* Editorial collections */}
				<section className="mt-14 px-4 pb-8">
					<p className="text-eyebrow">Collections</p>
					<h2 className="font-display text-2xl mt-1 mb-6">Shop by edit</h2>
					<div className="space-y-3">
						{collections.map((c) => (
							<button
								key={c.title}
								onClick={() => navigate("/categories")}
								className="relative block w-full h-56 overflow-hidden hover-zoom group">
								<img
									src={c.image}
									alt={c.title}
									className="w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-overlay" />
								<div className="absolute bottom-5 left-5 text-left text-background">
									<p className="text-[11px] uppercase tracking-display opacity-90">
										{c.subtitle}
									</p>
									<h3 className="font-display text-2xl mt-1">
										{c.title}
									</h3>
								</div>
							</button>
						))}
					</div>
				</section>

				{/* Just In */}
				<section className="mt-14 px-4 pb-8">
					<div className="flex items-end justify-between mb-6">
						<div>
							<p className="text-eyebrow">New</p>
							<h2 className="font-display text-2xl mt-1">Just In</h2>
						</div>
						<button
							onClick={() => navigate("/categories")}
							className="text-xs uppercase tracking-wider underline underline-offset-4 text-muted-foreground hover:text-foreground">
							View all
						</button>
					</div>

					{productsLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="space-y-3">
									<Skeleton className="aspect-[3/4] rounded-none" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-8">
							{products.slice(12, 24).map((product) => (
								<ProductCard
									key={product.id}
									{...product}
									onProductClick={(id) => navigate(`/product/${id}`)}
								/>
							))}
						</div>
					)}
				</section>
			</main>

			<BottomNavigation />
		</div>
	);
};

export default Home;
