
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import BottomNavigation from '@/components/BottomNavigation';

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
      <div className="relative">
        <img 
          src={product.images[currentImageIndex]} 
          alt={product.name}
          className="w-full h-80 object-cover"
        />
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 uppercase">{product.category}</span>
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">{product.rating} ({product.reviews})</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
        <p className="text-gray-600 mb-4">{product.brand}</p>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-pink-500">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-lg text-gray-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
          {product.originalPrice && (
            <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded text-sm font-medium">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </span>
          )}
        </div>

        <p className="text-gray-600 mb-6">{product.description}</p>

        {/* Size Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Size</h3>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedSize === size
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Color</h3>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedColor === color
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-full"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProductDetail;
