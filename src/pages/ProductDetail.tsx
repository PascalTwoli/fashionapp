
import React from 'react';
import { useParams } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Product Detail</h1>
        <div className="text-center text-gray-500 mt-20">
          <p>Product {id} details coming soon...</p>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProductDetail;
