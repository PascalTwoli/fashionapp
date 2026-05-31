
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
import Gallery from "./pages/Gallery";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import ShoppingBag from "./pages/ShoppingBag";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminSettingsShipping from "./pages/AdminSettingsShipping";
import AdminSettingsPaymentMethods from "./pages/AdminSettingsPaymentMethods";
import AdminSettingsDaraja from "./pages/AdminSettingsDaraja";
import AdminSettingsImageProcessing from "./pages/AdminSettingsImageProcessing";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Addresses from "./pages/Addresses";
import PaymentMethods from "./pages/PaymentMethods";
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
                <Route path="/product/:id/gallery" element={<Gallery />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<ShoppingBag />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/settings/shipping" element={<AdminSettingsShipping />} />
                <Route path="/admin/settings/payment-methods" element={<AdminSettingsPaymentMethods />} />
                <Route path="/admin/settings/daraja" element={<AdminSettingsDaraja />} />
                <Route path="/admin/settings/image-processing" element={<AdminSettingsImageProcessing />} />
                <Route path="/auth/google-callback" element={<GoogleOAuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/payment-methods" element={<PaymentMethods />} />
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
