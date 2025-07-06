
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
        {user ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-center mb-6">
              {user.avatar && (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
              )}
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <Button onClick={logout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-20">
            <p>Please log in to view your profile</p>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Profile;
