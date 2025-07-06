
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import BottomNavigation from '@/components/BottomNavigation';
import Logo from '@/components/Logo';

const Home = () => {
  const navigate = useNavigate();

  const categories = ['All', 'Men', 'Fashion', 'Women'];
  const [activeCategory, setActiveCategory] = React.useState('All');

  const products = [
    {
      id: '1',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 25.15,
      originalPrice: 30.15,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
      category: 'Fashion'
    },
    {
      id: '2',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 18.50,
      originalPrice: 25.13,
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
      category: 'Jacket'
    },
    {
      id: '3',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 20.15,
      originalPrice: 40.55,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop',
      category: 'Fashion'
    },
    {
      id: '4',
      name: 'Fashion Design',
      brand: 'FashionUp',
      price: 25.15,
      originalPrice: 30.15,
      image: 'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=400&h=300&fit=crop',
      category: 'Jacket'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon">
          <Menu className="w-5 h-5" />
        </Button>
        
        <Logo size="md" />

        <Button variant="ghost" size="icon">
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-pink-100 to-pink-200 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-pink-600 text-sm font-medium">FASHION DAY</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">35% Off</h2>
          <p className="text-gray-600 text-sm mt-1">Discover our latest Products</p>
          <Button className="bg-pink-500 hover:bg-pink-600 text-white mt-4 rounded-full px-6">
            Shop Now
          </Button>
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&h=150&fit=crop&crop=face" 
            alt="Fashion model"
            className="w-24 h-24 object-cover rounded-full"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mt-6">
        <div className="flex space-x-1 bg-gray-100 rounded-full p-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Most Popular Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Most Popular</h3>
          <button className="text-pink-500 text-sm">See more</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onProductClick={(id) => navigate(`/product/${id}`)}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Home;
