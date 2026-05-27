import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import { useNavbarVisibility } from '@/hooks/useNavbarVisibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Edit,
  Save,
  X,
  Settings,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, profile, logout, isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  // Scroll detection and navbar visibility
  const scrollState = useScrollDetection();
  const { isNavbarVisible, handleScroll } = useNavbarVisibility();

  // Update navbar visibility based on scroll
  React.useEffect(() => {
    handleScroll(scrollState.scrollDirection);
  }, [scrollState.scrollDirection, handleScroll]);

  React.useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading, navigate]);

  React.useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' });
    }
  }, [profile]);

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutDialogOpen(false);
    navigate('/login');
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name, avatar_url: formData.avatar_url || null })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (e) {
      console.error('Update error:', e);
      toast({ title: 'Update failed', description: 'Could not update your profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  const menuItems = [
    { icon: ShoppingBag, label: 'Orders', onClick: () => navigate('/orders') },
    { icon: Heart, label: 'Saved items', onClick: () => navigate('/wishlist') },
    { icon: MapPin, label: 'Addresses', onClick: () => {} },
    { icon: CreditCard, label: 'Payment methods', onClick: () => {} },
    { icon: HelpCircle, label: 'Help & support', onClick: () => {} },
  ];

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-display text-2xl">Account</h1>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
              className="rounded-none text-xs uppercase tracking-wider"
            >
              <Settings className="w-3.5 h-3.5 mr-2" />
              Admin
            </Button>
          )}
        </div>
      </header>

      {/* Profile header */}
      <section className="px-4 py-6 flex items-center gap-4">
      {formData.avatar_url || profile?.avatar_url ? (
          <img
            src={isEditing ? formData.avatar_url : profile?.avatar_url || ''}
            alt={profile?.name || 'Avatar'}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-display text-xl">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-medium truncate">{profile?.full_name || 'Welcome'}</h2>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </section>

      {isEditing && (
        <section className="px-4 pb-6 space-y-4 border-b border-border">
          <div>
            <Label htmlFor="full_name" className="text-xs uppercase tracking-wider">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1.5 rounded-none h-11"
            />
          </div>
          <div>
            <Label htmlFor="avatar_url" className="text-xs uppercase tracking-wider">Avatar URL</Label>
            <Input
              id="avatar_url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="mt-1.5 rounded-none h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-11 bg-foreground text-background rounded-none text-xs uppercase tracking-wider"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="h-11 rounded-none"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Menu */}
      <ul className="divide-y divide-border border-t border-border">
        {menuItems.map((item) => (
          <li key={item.label}>
            <button
              onClick={item.onClick}
              className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-secondary transition-colors"
            >
              <item.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              <span className="flex-1 text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 mt-8">
        <Button
          onClick={() => setIsLogoutDialogOpen(true)}
          variant="outline"
          className="w-full h-11 rounded-none text-xs uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
        </p>
      </div>

      <BottomNavigation isVisible={isNavbarVisible} />

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
