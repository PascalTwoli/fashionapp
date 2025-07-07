import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import BottomNavigation from '@/components/BottomNavigation';
import ProductImages from '@/components/ProductImages';
import ProductInfo from '@/components/ProductInfo';
import ProductOptions from '@/components/ProductOptions';
import AddToCartButton from '@/components/AddToCartButton';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Mock product data - in a real app, this would come from an API
  const products = [
    {
      id: '1',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 25.15,
      originalPrice: 30.15,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
      category: 'Fashion',
      description: 'A stylish and comfortable fashion piece perfect for any occasion. Made with high-quality materials and modern design.',
      rating: 4.5,
      reviews: 128,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'White', 'Pink', 'Blue'],
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop'
      ]
    },
    {
      id: '2',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 18.50,
      originalPrice: 25.13,
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
      category: 'Jacket',
      description: 'Trendy jacket perfect for casual and formal occasions. Features modern cut and premium fabric.',
      rating: 4.2,
      reviews: 89,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Navy', 'Black', 'Gray'],
      images: [
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400&h=300&fit=crop'
      ]
    },
    {
      id: '3',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 20.15,
      originalPrice: 40.55,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop',
      category: 'Fashion',
      description: 'Elegant and sophisticated design that combines comfort with style. Perfect for special occasions.',
      rating: 4.7,
      reviews: 203,
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Red', 'Black', 'White'],
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop'
      ]
    },
    {
      id: '4',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 25.15,
      originalPrice: 30.15,
      image: 'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=400&h=300&fit=crop',
      category: 'Jacket',
      description: 'Premium jacket with exceptional quality and timeless design. A must-have for your wardrobe.',
      rating: 4.6,
      reviews: 156,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Brown', 'Black', 'Tan'],
      images: [
        'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=400&h=300&fit=crop'
      ]
    }
  ];

  const product = products.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('');
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center text-gray-500 mt-20">
            <p>Product not found</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select both size and color before adding to cart');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      color: selectedColor
    });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Product Detail</h1>
        <Button variant="ghost" size="icon" onClick={handleWishlistToggle}>
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </div>

      {/* Product Images */}
      <ProductImages 
        images={product.images}
        productName={product.name}
        currentImageIndex={currentImageIndex}
        onImageChange={setCurrentImageIndex}
      />

      {/* Product Info */}
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

      {/* Product Options */}
      <ProductOptions 
        sizes={product.sizes}
        colors={product.colors}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        onSizeChange={setSelectedSize}
        onColorChange={setSelectedColor}
      />

      {/* Add to Cart Button */}
      <AddToCartButton onAddToCart={handleAddToCart} />

      <BottomNavigation />
    </div>
  );
};

export default ProductDetail;
