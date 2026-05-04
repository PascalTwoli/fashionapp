import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/BottomNavigation';
import { useCart } from '@/contexts/CartContext';

const ShoppingBagPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, total, itemCount } = useCart();

  const shipping = total >= 100 || total === 0 ? 0 : 9;
  const grandTotal = total + shipping;

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg">Shopping Bag</h1>
          <span className="w-10 text-right text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 mt-32">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5">
            <ShoppingBag className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-xl">Your bag is empty</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Discover our latest arrivals and add your favorites to the bag.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="mt-6 h-11 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider"
          >
            Continue shopping
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={`${item.id}-${item.size}-${item.color}`}
                className="flex gap-4 px-4 py-5"
              >
                <button
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="shrink-0 w-24 h-32 bg-muted overflow-hidden"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </button>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Size {item.size} · {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.size, item.color)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.color, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.color, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section className="px-4 pt-6 pb-4 mt-2 bg-secondary mx-4">
            <h3 className="text-eyebrow mb-3">Order summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between pt-3 mt-2 border-t border-border text-base font-semibold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* Sticky checkout */}
          <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border z-40">
            <Button
              onClick={() => navigate('/checkout')}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-sm tracking-wider uppercase"
            >
              Checkout · ${grandTotal.toFixed(2)}
            </Button>
          </div>
        </>
      )}

      <BottomNavigation />
    </div>
  );
};

export default ShoppingBagPage;
