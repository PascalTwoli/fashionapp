
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import ShoppingBag from "./pages/ShoppingBag";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<ShoppingBag />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/auth/google-callback" element={<GoogleOAuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
