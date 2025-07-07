
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import BottomNavigation from '@/components/BottomNavigation';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Wishlist</h1>
      </div>

      <div className="p-4">
        {wishlistItems.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg mb-2">Your wishlist is empty</p>
            <p className="text-sm">Start adding items you love!</p>
            <Button 
              onClick={() => navigate('/')}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 flex items-center space-x-4 shadow-sm">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)}
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">{item.category}</p>
                  <h3 
                    className="font-medium text-gray-900 cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">{item.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-pink-500 font-semibold">${item.price.toFixed(2)}</span>
                    {item.originalPrice && (
                      <span className="text-gray-400 text-sm line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromWishlist(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Wishlist;
