import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
	images: string[] | null;
	productName: string;
}

/**
 * Product Image Gallery - Premium editorial layout
 * - Desktop: vertical scrollable gallery on left
 * - Mobile: stacked vertical images
 * - Features: hover zoom, tap-to-fullscreen, fade loading
 */
const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
	images,
	productName,
}) => {
	const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
	const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const imageList = images && images.length > 0 ? images : ["/placeholder.png"];

	const handleImageLoad = (index: number) => {
		setImageLoaded((prev) => ({ ...prev, [index]: true }));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (fullscreenIndex === null) return;

		if (e.key === "Escape") {
			setFullscreenIndex(null);
		} else if (e.key === "ArrowLeft") {
			setFullscreenIndex(Math.max(0, fullscreenIndex - 1));
		} else if (e.key === "ArrowRight") {
			setFullscreenIndex(Math.min(imageList.length - 1, fullscreenIndex + 1));
		}
	};

	React.useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [fullscreenIndex, imageList.length]);

	return (
		<>
			{/* Desktop Gallery - Vertical Scrollable */}
			<div className="hidden lg:block h-screen overflow-y-auto scroll-smooth">
				<div className="space-y-0">
					{imageList.map((image, index) => (
						<div
							key={index}
							className="relative w-full aspect-square cursor-pointer overflow-hidden group"
							onClick={() => setFullscreenIndex(index)}
							onMouseEnter={() => setHoveredIndex(index)}
							onMouseLeave={() => setHoveredIndex(null)}>
							{/* Image container with hover zoom */}
							<div className="relative w-full h-full overflow-hidden bg-muted">
								{/* Fade loading skeleton */}
								{!imageLoaded[index] && (
									<div className="absolute inset-0 bg-muted animate-pulse" />
								)}

								{/* Image with zoom on hover */}
								<img
									src={image}
									alt={`${productName} view ${index + 1}`}
									onLoad={() => handleImageLoad(index)}
									className={cn(
										"w-full h-full object-cover transition-transform duration-300 ease-out",
										hoveredIndex === index && "scale-105",
									)}
								/>
							</div>

							{/* Subtle overlay hint on hover */}
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

							{/* Image counter on hover */}
							<div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<span className="text-xs text-white bg-black/40 px-2 py-1 rounded">
									{index + 1} / {imageList.length}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Mobile Gallery - Stacked */}
			<div className="lg:hidden space-y-0">
				{imageList.map((image, index) => (
					<div
						key={index}
						className="relative w-full aspect-square cursor-pointer overflow-hidden active:opacity-80 transition-opacity"
						onClick={() => setFullscreenIndex(index)}>
						{/* Fade loading skeleton */}
						{!imageLoaded[index] && (
							<div className="absolute inset-0 bg-muted animate-pulse" />
						)}

						<img
							src={image}
							alt={`${productName} view ${index + 1}`}
							onLoad={() => handleImageLoad(index)}
							className="w-full h-full object-cover"
						/>
					</div>
				))}
			</div>

			{/* Fullscreen Modal */}
			{fullscreenIndex !== null && (
				<div
					className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
					onClick={() => setFullscreenIndex(null)}>
					{/* Close button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							setFullscreenIndex(null);
						}}
						className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-white/10 transition-colors"
						aria-label="Close">
						<X className="w-6 h-6 text-white" />
					</button>

					{/* Main fullscreen image */}
					<div className="relative w-full h-full flex items-center justify-center p-4">
						<img
							src={imageList[fullscreenIndex]}
							alt={`${productName} fullscreen`}
							className="max-w-full max-h-full object-contain"
						/>
					</div>

					{/* Navigation arrows */}
					{imageList.length > 1 && (
						<>
							{/* Left arrow */}
							{fullscreenIndex > 0 && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										setFullscreenIndex(fullscreenIndex - 1);
									}}
									className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
									aria-label="Previous image">
									<svg
										className="w-6 h-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 19l-7-7 7-7"
										/>
									</svg>
								</button>
							)}

							{/* Right arrow */}
							{fullscreenIndex < imageList.length - 1 && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										setFullscreenIndex(fullscreenIndex + 1);
									}}
									className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
									aria-label="Next image">
									<svg
										className="w-6 h-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							)}

							{/* Image counter */}
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
								<span className="text-sm text-white bg-black/40 px-3 py-1 rounded">
									{fullscreenIndex + 1} / {imageList.length}
								</span>
							</div>
						</>
					)}

					{/* Keyboard hint */}
					<div className="absolute top-4 left-4 text-xs text-white/60 pointer-events-none">
						<p>ESC to close • ← → to navigate</p>
					</div>
				</div>
			)}
		</>
	);
};

export default ProductImageGallery;
