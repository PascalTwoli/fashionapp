import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import BottomNavigation from '@/components/BottomNavigation';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg">Saved Items</h1>
          <span className="w-10 text-right text-xs text-muted-foreground">
            {wishlistItems.length}
          </span>
        </div>
      </header>

      <div className="px-4 pt-6">
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center text-center mt-24">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5">
              <Heart className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl">Nothing saved yet</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Tap the heart on any product to save it here for later.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="mt-6 h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider"
            >
              Discover
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {wishlistItems.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <button
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="shrink-0 w-24 h-32 bg-muted overflow-hidden"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </button>
                <div className="flex-1 flex flex-col">
                  <p className="text-eyebrow">{item.brand}</p>
                  <h3
                    className="text-sm font-medium mt-1 cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-sm font-semibold">${item.price.toFixed(2)}</span>
                    {item.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="text-xs uppercase tracking-wider underline underline-offset-4 px-0"
                    >
                      View
                    </Button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Wishlist;
