import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [isProcessing, setIsProcessing] = useState(false);

  const shipping = total >= 100 || total === 0 ? 0 : 9;
  const grandTotal = total + shipping;

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl">Your bag is empty</h1>
        <Button
          onClick={() => navigate('/')}
          className="mt-6 h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider"
        >
          Continue shopping
        </Button>
      </div>
    );
  }

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      setStep('success');
      toast({ title: 'Order placed', description: 'Thank you for your purchase.' });
    }, 1200);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mb-6">
          <Check className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl">Order Confirmed</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-sm">
          Thank you for shopping with FashionUp. A confirmation has been sent to your email.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="mt-8 h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider"
        >
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 'payment' ? setStep('address') : navigate(-1))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg">Checkout</h1>
          <div className="w-10" />
        </div>
        {/* Step indicator */}
        <div className="flex items-center px-4 pb-3 gap-2 text-xs uppercase tracking-wider">
          <span className={step === 'address' ? 'text-foreground' : 'text-muted-foreground'}>
            1. Address
          </span>
          <span className="flex-1 h-px bg-border" />
          <span className={step === 'payment' ? 'text-foreground' : 'text-muted-foreground'}>
            2. Payment
          </span>
        </div>
      </header>

      <main className="px-4 pt-6">
        {step === 'address' && (
          <form onSubmit={handleSubmitAddress} className="space-y-4">
            <h2 className="text-eyebrow">Delivery address</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required className="mt-1.5 rounded-none" />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required className="mt-1.5 rounded-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Street address</Label>
              <Input id="address" required className="mt-1.5 rounded-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" required className="mt-1.5 rounded-none" />
              </div>
              <div>
                <Label htmlFor="zip">Postal code</Label>
                <Input id="zip" required className="mt-1.5 rounded-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" defaultValue="United States" required className="mt-1.5 rounded-none" />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-4"
            >
              Continue to payment
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <h2 className="text-eyebrow">Payment details</h2>
            <div>
              <Label htmlFor="card">Card number</Label>
              <Input
                id="card"
                placeholder="1234 5678 9012 3456"
                required
                className="mt-1.5 rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="MM / YY" required className="mt-1.5 rounded-none" />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" required className="mt-1.5 rounded-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">Name on card</Label>
              <Input id="cardName" required className="mt-1.5 rounded-none" />
            </div>

            <section className="mt-6 p-4 bg-secondary">
              <h3 className="text-eyebrow mb-3">Order summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-border text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-4"
            >
              {isProcessing ? 'Processing…' : `Pay $${grandTotal.toFixed(2)}`}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default Checkout;
