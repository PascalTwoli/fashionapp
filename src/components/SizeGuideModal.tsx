import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SizeGuideModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<>
			{/* Overlay */}
			<div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

			{/* Modal - slides in from right */}
			<div
				className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 overflow-y-auto transform transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="sticky top-0 bg-white border-b border-border flex items-center justify-between p-4">
					<h2 className="text-lg font-semibold">Size Guide</h2>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="rounded-full">
						<X className="w-5 h-5" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* How to Measure */}
					<section>
						<h3 className="text-base font-semibold mb-3">
							How to Measure
						</h3>
						<div className="space-y-3 text-sm">
							<div>
								<p className="font-medium mb-1">Chest/Bust</p>
								<p className="text-muted-foreground">
									Measure across the fullest part of your chest,
									keeping the tape parallel to the ground.
								</p>
							</div>
							<div>
								<p className="font-medium mb-1">Waist</p>
								<p className="text-muted-foreground">
									Measure around your natural waist, where your body
									naturally bends.
								</p>
							</div>
							<div>
								<p className="font-medium mb-1">Length</p>
								<p className="text-muted-foreground">
									For tops: measure from the shoulder seam to the hem.
									For pants: measure from the waistband to the ankle.
								</p>
							</div>
						</div>
					</section>

					{/* Size Chart */}
					<section>
						<h3 className="text-base font-semibold mb-3">
							Size Chart (cm)
						</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-sm border-collapse">
								<thead>
									<tr className="border-b border-border">
										<th className="text-left py-2 px-2 font-medium">
											Size
										</th>
										<th className="text-left py-2 px-2 font-medium">
											XS
										</th>
										<th className="text-left py-2 px-2 font-medium">
											S
										</th>
										<th className="text-left py-2 px-2 font-medium">
											M
										</th>
										<th className="text-left py-2 px-2 font-medium">
											L
										</th>
										<th className="text-left py-2 px-2 font-medium">
											XL
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-b border-border">
										<td className="py-2 px-2 font-medium">
											Chest (cm)
										</td>
										<td className="py-2 px-2">78</td>
										<td className="py-2 px-2">84</td>
										<td className="py-2 px-2">92</td>
										<td className="py-2 px-2">100</td>
										<td className="py-2 px-2">108</td>
									</tr>
									<tr className="border-b border-border">
										<td className="py-2 px-2 font-medium">
											Waist (cm)
										</td>
										<td className="py-2 px-2">64</td>
										<td className="py-2 px-2">70</td>
										<td className="py-2 px-2">78</td>
										<td className="py-2 px-2">86</td>
										<td className="py-2 px-2">94</td>
									</tr>
									<tr>
										<td className="py-2 px-2 font-medium">
											Length (cm)
										</td>
										<td className="py-2 px-2">68</td>
										<td className="py-2 px-2">71</td>
										<td className="py-2 px-2">74</td>
										<td className="py-2 px-2">77</td>
										<td className="py-2 px-2">80</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>

					{/* Fit Guide */}
					<section>
						<h3 className="text-base font-semibold mb-3">Fit Guide</h3>
						<div className="space-y-3 text-sm">
							<div className="flex gap-3">
								<div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
								<div>
									<p className="font-medium">Slim Fit</p>
									<p className="text-muted-foreground">
										Close to the body with minimal ease
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 mt-1" />
								<div>
									<p className="font-medium">Regular Fit</p>
									<p className="text-muted-foreground">
										Comfortable with moderate ease
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0 mt-1" />
								<div>
									<p className="font-medium">Relaxed Fit</p>
									<p className="text-muted-foreground">
										Loose with extra room for movement
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* Tips */}
					<section>
						<h3 className="text-base font-semibold mb-3">
							Shopping Tips
						</h3>
						<ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
							<li>Wear your normal undergarments when measuring</li>
							<li>Keep the tape measure snug but not tight</li>
							<li>
								If you're between sizes, consider the fit and how you
								like to wear items
							</li>
							<li>Different fabrics may fit differently</li>
							<li>
								Check individual product descriptions for fit notes
							</li>
						</ul>
					</section>

					{/* Closing action */}
					<Button onClick={onClose} className="w-full" variant="default">
						Got it, thanks!
					</Button>
				</div>
			</div>
		</>
	);
};

export default SizeGuideModal;
