
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { user, profile, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            {profile?.avatar && (
              <img 
                src={profile.avatar} 
                alt={profile.name || 'User'}
                className="w-20 h-20 rounded-full mx-auto mb-4"
              />
            )}
            <h2 className="text-xl font-semibold">{profile?.name || 'User'}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Profile;
