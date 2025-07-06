
import React from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import { useCart } from '@/contexts/CartContext';

const ShoppingBag = () => {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Bag</h1>
        <div className="text-center text-gray-500 mt-20">
          <p>Your bag has {itemCount} items</p>
          <p className="mt-2">Shopping bag functionality coming soon...</p>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ShoppingBag;
