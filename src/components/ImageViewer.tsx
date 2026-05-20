import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
	images: string[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Premium image viewer/lightbox component
 * - Full-screen dark overlay
 * - Zoomed image display
 * - Next/Previous navigation
 * - Keyboard support (ESC to close, Arrow keys to navigate)
 * - Mobile swipe support
 */
const ImageViewer: React.FC<ImageViewerProps> = ({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
}) => {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goPrev();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, currentIndex]);

	// Prevent body scroll when viewer is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	const goNext = () => {
		setCurrentIndex((prev) => (prev + 1) % images.length);
	};

	const goPrev = () => {
		setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
	};

	const handleSwipe = () => {
		if (!touchStart || !touchEnd) return;
		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > 50;
		const isRightSwipe = distance < -50;

		if (isLeftSwipe) goNext();
		if (isRightSwipe) goPrev();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Dark overlay background */}
			<div
				className="absolute inset-0 bg-black/95"
				onClick={onClose}
				style={{ animation: "fadeIn 0.2s ease-in" }}
			/>

			{/* Content */}
			<div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
					aria-label="Close">
					<X className="w-6 h-6" />
				</button>

				{/* Main image container */}
				<div
					className="max-w-4xl max-h-[80vh] flex items-center justify-center"
					onTouchStart={(e) => setTouchStart(e.changedTouches[0].clientX)}
					onTouchEnd={(e) => {
						setTouchEnd(e.changedTouches[0].clientX);
						handleSwipe();
					}}>
					<img
						src={images[currentIndex]}
						alt={`Image ${currentIndex + 1}`}
						className="max-w-full max-h-full object-contain"
						loading="lazy"
					/>
				</div>

				{/* Navigation arrows - desktop only */}
				{images.length > 1 && (
					<>
						<button
							onClick={goPrev}
							className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
							aria-label="Previous image">
							<ChevronLeft className="w-6 h-6" />
						</button>
						<button
							onClick={goNext}
							className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
							aria-label="Next image">
							<ChevronRight className="w-6 h-6" />
						</button>
					</>
				)}

				{/* Counter and thumbnails */}
				{images.length > 1 && (
					<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
						{/* Counter */}
						<p className="text-white text-sm font-medium">
							{currentIndex + 1} / {images.length}
						</p>

						{/* Thumbnail indicators */}
						<div className="flex gap-2 flex-wrap justify-center max-w-md">
							{images.map((img, idx) => (
								<button
									key={idx}
									onClick={() => setCurrentIndex(idx)}
									className={`w-10 h-10 rounded border-2 transition-all ${
										idx === currentIndex
											? "border-white/80"
											: "border-white/30 hover:border-white/50"
									}`}>
									<img
										src={img}
										alt={`Thumbnail ${idx + 1}`}
										className="w-full h-full object-cover rounded"
										loading="lazy"
									/>
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
			`}</style>
		</div>
	);
};

export default ImageViewer;
