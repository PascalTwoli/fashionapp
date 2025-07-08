
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, Settings } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    avatar: profile?.avatar || ''
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        avatar: profile.avatar || ''
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          avatar: formData.avatar || null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setIsEditing(false);
      // The profile will be automatically updated through the auth context
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      avatar: profile?.avatar || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-pink-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              {(isEditing ? formData.avatar : profile?.avatar) && (
                <img 
                  src={isEditing ? formData.avatar : profile?.avatar || ''} 
                  alt={isEditing ? formData.name : profile?.name || 'User'}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
              )}
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    type="url"
                    placeholder="Enter image URL"
                    value={formData.avatar}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{profile?.name || 'User'}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Member since {new Date(profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Profile;
