import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';

type View = 'signin' | 'forgot' | 'forgot-sent';

const Login = () => {
  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await login(email, password);
    if (error) {
      toast({
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Welcome back', description: "You've been signed in." });
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setView('forgot-sent');
    } catch (err: any) {
      toast({
        title: 'Failed to send reset email',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back button */}
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

      {/* Editorial side image */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-1/2">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:ml-[50%]">
        <div className="w-full max-w-sm">

          {/* ── Sign in ── */}
          {view === 'signin' && (
            <>
              <div className="mb-10">
                <Logo size="lg" />
                <h1 className="font-display text-3xl mt-8">Sign in</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Welcome back. Please enter your details.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 rounded-none h-11"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setView('forgot'); }}
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 rounded-none h-11"
                      required
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

                <Button
                  type="submit"
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  New to FashionUp?{' '}
                  <Link to="/register" className="text-foreground underline underline-offset-4">
                    Create an account
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* ── Forgot password ── */}
          {view === 'forgot' && (
            <>
              <div className="mb-10">
                <Logo size="lg" />
                <h1 className="font-display text-3xl mt-8">Reset password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <Label htmlFor="resetEmail" className="text-xs uppercase tracking-wider">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-1.5 rounded-none h-11"
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs uppercase tracking-wider"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? 'Sending…' : 'Send reset link'}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  <button
                    type="button"
                    onClick={() => setView('signin')}
                    className="text-foreground underline underline-offset-4"
                  >
                    Back to sign in
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ── Forgot password sent ── */}
          {view === 'forgot-sent' && (
            <div className="text-center">
              <Logo size="lg" className="mx-auto" />
              <div className="mt-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl">Check your email</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{resetEmail}</span>.
                  The link expires in 1 hour.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => setView('forgot')}
                    className="underline underline-offset-4 text-foreground"
                  >
                    try again
                  </button>.
                </p>
              </div>
              <div className="mt-10">
                <button
                  onClick={() => setView('signin')}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
