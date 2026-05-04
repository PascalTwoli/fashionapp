import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Truck, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';
import ProductImages from '@/components/ProductImages';
import ProductInfo from '@/components/ProductInfo';
import ProductOptions from '@/components/ProductOptions';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const product = products.find((p) => p.id === id);

  const [selectedSize, setSelectedSize] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('');
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
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
        title: 'Select size & color',
        description: 'Please choose a size and color before adding to bag.',
        variant: 'destructive',
      });
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      color: selectedColor,
    });
    toast({ title: 'Added to bag', description: `${product.name} (${selectedSize}, ${selectedColor})` });
  };

  const related = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Floating header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-background/80 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="bg-background/80 rounded-full" aria-label="Share">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlistToggle}
            className="bg-background/80 rounded-full"
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-accent text-accent' : ''}`} />
          </Button>
        </div>
      </header>

      <ProductImages
        images={product.images}
        productName={product.name}
        currentImageIndex={currentImageIndex}
        onImageChange={setCurrentImageIndex}
      />

      <ProductInfo
        category={product.category}
        rating={product.rating}
        reviews={product.reviews}
        name={product.name}
        brand={product.brand}
        price={product.price}
        originalPrice={product.originalPrice}
        description={product.description}
      />

      <ProductOptions
        sizes={product.sizes}
        colors={product.colors}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        onSizeChange={setSelectedSize}
        onColorChange={setSelectedColor}
      />

      {/* Service highlights */}
      <section className="mt-10 mx-4 border-t border-border divide-y divide-border">
        {[
          { icon: Truck, label: 'Free shipping over $100', sub: 'Delivered in 2–4 business days' },
          { icon: RotateCcw, label: 'Free returns within 30 days', sub: 'No questions asked' },
          { icon: Shield, label: 'Secure checkout', sub: 'Encrypted & protected' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 py-4">
            <item.icon className="w-5 h-5 text-foreground shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Related */}
      <section className="mt-12 px-4">
        <p className="text-eyebrow">You may also like</p>
        <h3 className="font-display text-xl mt-1 mb-5">Complete the look</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8">
          {related.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
              onProductClick={(pid) => navigate(`/product/${pid}`)}
            />
          ))}
        </div>
      </section>

      <AddToCartButton onAddToCart={handleAddToCart} />
      <BottomNavigation />
    </div>
  );
};

export default ProductDetail;
