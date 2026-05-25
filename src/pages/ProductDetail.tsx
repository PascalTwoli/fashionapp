import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Heart,
	Share2,
	Truck,
	RotateCcw,
	Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import { useNavbarVisibility } from "@/hooks/useNavbarVisibility";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingNavButton from "@/components/FloatingNavButton";
import ShareProductSheet from "@/components/ShareProductSheet";
import ProductInfo from "@/components/ProductInfo";
import ProductOptions from "@/components/ProductOptions";
import AddToCartButton from "@/components/AddToCartButton";
import RecommendationSection from "@/components/RecommendationSection";
import SizeGuideModal from "@/components/SizeGuideModal";
import { useProduct, useAllProducts } from "@/hooks/useProducts";
import { useProductVariants } from "@/hooks/useProductVariants";
import { generateProductSlug, generateProductUrl } from "@/lib/shareUtils";
import { updateProductMetaTags, generateProductDescription } from "@/lib/metaTags";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
	const { addToCart } = useCart();
	const { toast } = useToast();

	// Fetch single product
	const {
		data: product,
		isLoading: productLoading,
		error: productError,
	} = useProduct(id);

	// Fetch product variants (size/color inventory) - use product.id once resolved
	const { data: variants = [] } = useProductVariants(product?.id);

	// Fetch all products for related items (show active and archived, hide draft)
	const { data: allProducts = [] } = useAllProducts();
	const activeProducts = allProducts.filter(
		(p) => p.status === "active" || p.status === "archived" || !p.status,
	);

	const [selectedSize, setSelectedSize] = React.useState("");
	const [selectedColor, setSelectedColor] = React.useState("");
	const [isSizeGuideOpen, setIsSizeGuideOpen] = React.useState(false);
	const [isShareSheetOpen, setIsShareSheetOpen] = React.useState(false);
	const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
	const [fullscreenIndex, setFullscreenIndex] = React.useState<number | null>(null);
	const [requireWhiteBgForRecommendations, setRequireWhiteBgForRecommendations] = React.useState(true);

	// Scroll detection and navbar visibility
	const scrollState = useScrollDetection();
	const { isNavbarVisible, toggleNavbar, handleScroll } = useNavbarVisibility();

	// Update navbar visibility based on scroll
	React.useEffect(() => {
		handleScroll(scrollState.scrollDirection);
	}, [scrollState.scrollDirection, handleScroll]);

	// Update header visibility based on scroll (hide on down, show on up/idle)
	React.useEffect(() => {
		if (scrollState.scrollDirection === 'down') {
			setIsHeaderVisible(false);
		} else if (scrollState.scrollDirection === 'up' || scrollState.scrollDirection === 'idle') {
			setIsHeaderVisible(true);
		}
	}, [scrollState.scrollDirection]);

	// Load white background requirement setting
	React.useEffect(() => {
		const loadWhiteBgSetting = async () => {
			try {
				const { data, error } = await supabase
					.from('admin_settings')
					.select('value')
					.eq('key', 'require_white_bg_for_recommendations')
					.single();

				if (error && error.code !== 'PGRST116') throw error;
				
				if (data) {
					setRequireWhiteBgForRecommendations(data.value ?? true);
				}
			} catch (error) {
				console.error('[ProductDetail] Failed to load white bg setting:', error);
				// Default to true if setting not found
				setRequireWhiteBgForRecommendations(true);
			}
		};

		loadWhiteBgSetting();
	}, []);

	// Update meta tags for social sharing when product loads
	React.useEffect(() => {
		if (!product || !product.id) return;

		try {
			const productSlug = generateProductSlug(product.name);
			const productUrl = generateProductUrl(productSlug, product.id);
			const productImage = product.images?.[0] || product.image_url || '';
			const description = generateProductDescription(
				product.name,
				product.category,
				product.brand,
				product.discount_price ? product.discount_price < product.price : false,
			);

			updateProductMetaTags({
				title: product.name,
				description: description,
				image: productImage,
				url: productUrl,
				price: product.discount_price ? product.discount_price.toString() : product.price.toString(),
				originalPrice: product.discount_price && product.discount_price < product.price ? product.price.toString() : undefined,
				brand: product.brand || 'FashionUp',
				category: product.category,
				productId: product.id,
				rating: product.rating,
				reviews: product.reviews,
			});
		} catch (error) {
			console.error('[ProductDetail] Failed to update meta tags:', error);
		}
	}, [product?.id]);



	// Get available colors from variants
	const availableColors = React.useMemo(() => {
		return Array.from(new Set(variants.map((v) => v.color))).sort();
	}, [variants]);

	// Get available sizes for selected color
	const availableSizes = React.useMemo(() => {
		if (!selectedColor) return [];
		return Array.from(
			new Set(
				variants
					.filter((v) => v.color === selectedColor && v.stock_quantity > 0)
					.map((v) => v.size),
			),
		).sort();
	}, [selectedColor, variants]);

	// Reset size when color changes
	React.useEffect(() => {
		setSelectedSize("");
	}, [selectedColor]);

	// Get selected variant for stock check
	const selectedVariant = React.useMemo(() => {
		if (!selectedSize || !selectedColor) return null;
		return variants.find(
			(v) => v.size === selectedSize && v.color === selectedColor,
		);
	}, [selectedSize, selectedColor, variants]);

	const isVariantOutOfStock =
		!selectedVariant || selectedVariant.stock_quantity <= 0;

	// Handle loading state
	if (productLoading) {
		return (
			<div className="min-h-screen bg-background pb-20">
				<div className="p-4">
					<Button
						variant="ghost"
						onClick={() => navigate(-1)}
						className="mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" /> Back
					</Button>
					<Skeleton className="h-80 rounded-none mb-6" />
					<Skeleton className="h-4 w-3/4 mb-3" />
					<Skeleton className="h-4 w-1/2 mb-6" />
					<Skeleton className="h-10 w-full" />
				</div>
				<BottomNavigation />
			</div>
		);
	}

	// Handle not found state
	if (!product || productError) {
		return (
			<div className="min-h-screen bg-background pb-20">
				<div className="p-4">
					<Button
						variant="ghost"
						onClick={() => navigate(-1)}
						className="mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" /> Back
					</Button>
					<div className="text-center text-muted-foreground mt-20">
						<p>Product not found</p>
					</div>
				</div>
				<BottomNavigation />
			</div>
		);
	}

	const isWishlisted = isInWishlist(product.id);
	const handleWishlistToggle = () => {
		if (isWishlisted) removeFromWishlist(product.id);
		else addToWishlist(product);
	};

	const handleAddToCart = () => {
		if (!selectedSize || !selectedColor) {
			toast({
				title: "Select size & color",
				description: "Please choose a size and color before adding to bag.",
				variant: "destructive",
			});
			return;
		}

		if (isVariantOutOfStock) {
			toast({
				title: "Out of stock",
				description: `${selectedColor} in size ${selectedSize} is not available.`,
				variant: "destructive",
			});
			return;
		}

		addToCart({
			product_id: product.id,
			variant_id: selectedVariant?.id,
			name: product.name,
			price: product.price,
			image: product.images?.[0] || product.image,
			size: selectedSize,
			color: selectedColor,
		});
		toast({
			title: "Added to bag",
			description: `${product.name} (${selectedColor}, ${selectedSize})`,
		});
	};

	// Split images: hero (first) and grid (remaining) - Zara style
	const heroImage = product.images?.[0];
	const gridImages = product.images?.slice(1) || [];

	// Complementary products for "STYLE WITH"
	const complementaryCategories: Record<string, string[]> = {
		dress: ['shoes', 'handbags', 'jackets', 'accessories'],
		shoes: ['dresses', 'bags', 'shirts', 'accessories'],
		handbags: ['shoes', 'dresses', 'accessories'],
		jackets: ['dresses', 'shirts', 'pants', 'shoes'],
		tops: ['pants', 'skirts', 'shoes', 'accessories'],
		pants: ['tops', 'shoes', 'belts', 'jackets'],
		accessories: ['all'],
	};

	const styleWith = activeProducts
		.filter((p) => {
			if (p.id === product.id) return false;
			// Only show products with white background if setting requires it
			if (requireWhiteBgForRecommendations && !p.has_white_background) return false;
			// Gender matching: same gender or unisex
			const currentGender = product.gender?.toLowerCase() || '';
			const pGender = p.gender?.toLowerCase() || '';
			const genderMatch = currentGender === pGender || 
				pGender === 'unisex' || 
				currentGender === 'unisex';
			if (!genderMatch) return false;
			// Category matching for complementary items
			const currentCategory = product.category?.toLowerCase() || '';
			const complements = complementaryCategories[currentCategory] || [];
			const pCategory = p.category?.toLowerCase() || '';
			return complements.includes('all') || complements.some(c => pCategory.includes(c));
		});

	// Similar products for "YOU MAY ALSO LIKE"
	const youMayAlsoLike = activeProducts
		.filter((p) => {
			if (p.id === product.id) return false;
			// Only show products with white background if setting requires it
			if (requireWhiteBgForRecommendations && !p.has_white_background) return false;
			const sameCategory = p.category?.toLowerCase() === product.category?.toLowerCase();
			return sameCategory;
		});


	return (
		<div className="min-h-screen bg-background">
			{/* Main content wrapper with max-width and centering */}
			<div className="px-6 lg:px-32 max-w-7xl mx-auto w-full">
				{/* Fixed header - Auto-hide on scroll */}
			<header className={cn(
				"fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-3",
				"bg-background/80 backdrop-blur-md",
				"transition-all duration-300 ease-out",
				isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
			)}>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate(-1)}
					className="bg-background/80 rounded-full">
					<ArrowLeft className="w-5 h-5" />
				</Button>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsShareSheetOpen(true)}
						className="bg-background/80 rounded-full"
						aria-label="Share">
						<Share2 className="w-5 h-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleWishlistToggle}
						className="bg-background/80 rounded-full"
						aria-label="Wishlist">
						<Heart
							className={`w-5 h-5 ${isWishlisted ? "fill-accent text-accent" : ""}`}
						/>
					</Button>
				</div>
			</header>

			{/* HERO SECTION: First image + Product details side-by-side (Zara style) */}
			<div className="pt-14 lg:grid lg:grid-cols-2 lg:min-h-screen lg:gap-8">
				{/* Left: Hero image (large, clickable for fullscreen) */}
				<div className="relative bg-gray-50 flex items-center justify-center min-h-80 lg:min-h-screen lg:max-w-2xl overflow-hidden group cursor-pointer"
					onClick={() => navigate(`/product/${id}/gallery?index=0`)}>
					{heroImage ? (
						<>
							<img
								src={heroImage}
								alt={product.name}
								className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
							{/* Image counter on hover (desktop) */}
							<div className="hidden lg:block absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-opacity">
								1 / {product.images?.length || 1}
							</div>
						</>
					) : (
						<Skeleton className="w-full h-96 rounded-none" />
					)}
				</div>

				{/* Right: Product details (sticky on desktop) */}
			<div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto scrollbar-none">
					<div className="px-4 py-6 lg:py-8 lg:px-6 space-y-6">
						<ProductInfo
							category={product.category}
							rating={product.rating}
							reviews={product.reviews}
							name={product.name}
							brand={product.brand}
							price={product.price}
							discount_price={product.discount_price}
							gender={product.gender}
							description={product.description}
						/>

						<ProductOptions
							sizes={availableSizes}
							colors={availableColors}
							selectedSize={selectedSize}
							selectedColor={selectedColor}
							onSizeChange={setSelectedSize}
							onColorChange={setSelectedColor}
							onSizeGuideClick={() => setIsSizeGuideOpen(true)}
						onClearSelections={() => {
							setSelectedSize("");
							setSelectedColor("");
						}}
						isOutOfStock={isVariantOutOfStock}
						stockQuantity={selectedVariant?.stock_quantity}
					/>

					{/* Service highlights */}
					<section className="divide-y divide-border">
						{[
							{
								icon: Truck,
								label: "Free shipping over KES 10,000",
								sub: "Delivered in 2–4 business days",
							},
								{
									icon: RotateCcw,
									label: "Free returns within 30 days",
									sub: "No questions asked",
								},
								{
									icon: Shield,
									label: "Secure checkout",
									sub: "Encrypted & protected",
								},
							].map((item) => (
								<div key={item.label} className="flex items-center gap-4 py-4">
									<item.icon
										className="w-5 h-5 text-foreground shrink-0"
										strokeWidth={1.5}
									/>
									<div>
										<p className="text-sm font-medium">{item.label}</p>
										<p className="text-xs text-muted-foreground">{item.sub}</p>
									</div>
								</div>
							))}
						</section>
					</div>
				</div>
			</div>

			{/* IMAGE GRID SECTION: Remaining images (Zara style - max 2 columns with elegant spacing) */}
			{gridImages.length > 0 && (
				<section className="py-16 lg:py-24">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 lg:gap-x-12 lg:gap-y-16">
						{gridImages.map((img, idx) => (
							<div
								key={idx}
								className="relative bg-gray-50 overflow-hidden group cursor-pointer"
								onClick={() => navigate(`/product/${id}/gallery?index=${idx + 1}`)}>
								<img
									src={img}
									alt={`${product.name} - view ${idx + 2}`}
									className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
								/>
								{/* Image counter on hover */}
								<div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-opacity">
									{idx + 2} / {product.images?.length || 1}
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{/* RECOMMENDATION SECTIONS */}
			<RecommendationSection
				title="Complete the look"
				subtitle="Style with"
				products={styleWith}
				variant="grid"
			/>

			<RecommendationSection
				title="You may also like"
				subtitle="Similar items"
				products={youMayAlsoLike}
				variant="grid"
			/>

			{/* FULLSCREEN IMAGE GALLERY MODAL */}
			{fullscreenIndex !== null && product.images && (
				<div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
					{/* Close button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setFullscreenIndex(null)}
						className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full z-60"
						aria-label="Close fullscreen">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</Button>

					{/* Main fullscreen image */}
					<div className="relative w-full h-full flex items-center justify-center px-4">
						<img
							src={product.images[fullscreenIndex]}
							alt={`${product.name} - fullscreen view ${fullscreenIndex + 1}`}
							className="max-w-full max-h-full object-contain"
						/>
					</div>

					{/* Navigation arrows and counter */}
					{product.images.length > 1 && (
						<div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setFullscreenIndex(fullscreenIndex === 0 ? product.images!.length - 1 : fullscreenIndex - 1)}
								className="text-white hover:bg-white/20 rounded-full"
								aria-label="Previous image">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</Button>
							<span className="text-white text-sm font-medium">
								{fullscreenIndex + 1} / {product.images.length}
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setFullscreenIndex(fullscreenIndex === product.images!.length - 1 ? 0 : fullscreenIndex + 1)}
								className="text-white hover:bg-white/20 rounded-full"
								aria-label="Next image">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Button>
						</div>
					)}

					{/* Keyboard navigation */}
					{React.useEffect(() => {
						const handleKeyDown = (e: KeyboardEvent) => {
							if (!product.images) return;
							if (e.key === 'Escape') setFullscreenIndex(null);
							if (e.key === 'ArrowLeft') setFullscreenIndex(fullscreenIndex === 0 ? product.images!.length - 1 : fullscreenIndex - 1);
							if (e.key === 'ArrowRight') setFullscreenIndex(fullscreenIndex === product.images!.length - 1 ? 0 : fullscreenIndex + 1);
						};
						window.addEventListener('keydown', handleKeyDown);
						return () => window.removeEventListener('keydown', handleKeyDown);
					}, [fullscreenIndex, product.images]) && null}
				</div>
			)}

			<SizeGuideModal
				isOpen={isSizeGuideOpen}
				onClose={() => setIsSizeGuideOpen(false)}
			/>

			<ShareProductSheet
				isOpen={isShareSheetOpen}
				onClose={() => setIsShareSheetOpen(false)}
				productName={product.name}
				productPrice={product.price}
				discountPrice={product.discount_price}
				productImage={product.images?.[0] || product.image_url || ''}
				productUrl={generateProductUrl(generateProductSlug(product.name), product.id)}
				productId={product.id}
			/>

				<AddToCartButton 
					onAddToCart={handleAddToCart} 
					selectedColor={selectedColor} 
					selectedSize={selectedSize}					isNavbarVisible={isNavbarVisible}			/>
			<FloatingNavButton isNavbarVisible={isNavbarVisible} onToggle={toggleNavbar} />
			<BottomNavigation isVisible={isNavbarVisible} />
			</div>
		</div>
	);
};

export default ProductDetail;
