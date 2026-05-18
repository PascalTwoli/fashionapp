import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface BottomNavigationProps {
	isVisible?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isVisible = true }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { totalItems } = useCart();

	const navItems = [
		{ icon: Home, label: "Shop", path: "/" },
		{ icon: Search, label: "Browse", path: "/categories" },
		{ icon: ShoppingBag, label: "Bag", path: "/cart", badge: totalItems },
		{ icon: Heart, label: "Saved", path: "/wishlist" },
		{ icon: User, label: "Account", path: "/profile" },
	];

	return (
		<nav
			className={cn(
				"fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40",
				"transition-transform duration-300 ease-out",
				isVisible ? "translate-y-0" : "translate-y-full",
			)}>
			<div className="flex justify-around items-center max-w-md mx-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{navItems.map((item) => {
					const isActive = location.pathname === item.path;
					return (
						<button
							key={item.path}
							onClick={() => navigate(item.path)}
							className={cn(
								"flex flex-col items-center justify-center px-3 py-1.5 min-w-[56px] relative transition-colors",
								isActive
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
							aria-label={item.label}>
							<div className="relative">
								<item.icon
									className="w-5 h-5"
									strokeWidth={isActive ? 2 : 1.5}
								/>
								{item.badge && item.badge > 0 ? (
									<span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-medium">
										{item.badge > 99 ? "99+" : item.badge}
									</span>
								) : null}
							</div>
							<span className="text-[10px] mt-1 tracking-wide uppercase">
								{item.label}
							</span>
							{isActive && (
								<span className="absolute -bottom-2 w-1 h-1 rounded-full bg-foreground" />
							)}
						</button>
					);
				})}
			</div>
		</nav>
	);
};

export default BottomNavigation;
