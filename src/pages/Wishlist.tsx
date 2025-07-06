
import React from 'react';
import BottomNavigation from '@/components/BottomNavigation';

const Wishlist = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h1>
        <div className="text-center text-gray-500 mt-20">
          <p>Your wishlist is empty</p>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Wishlist;
