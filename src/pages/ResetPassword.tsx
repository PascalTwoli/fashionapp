import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';

type Status = 'loading' | 'ready' | 'success' | 'invalid';

const ResetPassword = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase handles the code exchange automatically when detectSessionInUrl is true.
    // We listen for PASSWORD_RECOVERY to know the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    // Also check if a session is already active (user may have landed after the exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready');
      else {
        // Give the PASSWORD_RECOVERY event a moment to fire
        setTimeout(() => {
          setStatus(prev => prev === 'loading' ? 'invalid' : prev);
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('success');
    } catch (err: any) {
      toast({
        title: 'Failed to update password',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Button>
      </div>

      <div className="hidden md:block fixed inset-y-0 left-0 w-1/2">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:ml-[50%]">
        <div className="w-full max-w-sm">

          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Verifying reset link…</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {status === 'invalid' && (
            <div className="text-center space-y-4">
              <Logo size="lg" className="mx-auto" />
              <div className="mt-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl">Link expired</h1>
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired. Reset links are valid for 1 hour.
                </p>
                <Button
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-4"
                  onClick={() => navigate('/login')}
                >
                  Request a new link
                </Button>
              </div>
            </div>
          )}

          {/* New password form */}
          {status === 'ready' && (
            <>
              <div className="mb-10">
                <Logo size="lg" />
                <h1 className="font-display text-3xl mt-8">New password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider">New password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 rounded-none h-11"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5 rounded-none h-11"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating…' : 'Set new password'}
                </Button>
              </form>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center">
              <Logo size="lg" className="mx-auto" />
              <div className="mt-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl">Password updated</h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
                <Button
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider mt-4"
                  onClick={() => navigate('/login')}
                >
                  Go to sign in
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
