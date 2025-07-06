
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = 'md', showText = true, className = '' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg`}>
        <div className="relative">
          {/* Fashion hanger icon using CSS */}
          <div className="w-4 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-3 bg-white rounded-full mx-auto -mt-0.5"></div>
          <div className="w-3 h-0.5 bg-white rounded-full mx-auto -mt-1"></div>
          <div className="flex justify-between w-4 -mt-0.5">
            <div className="w-1.5 h-2 bg-white rounded-full"></div>
            <div className="w-1.5 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      {showText && (
        <span className={`ml-2 font-bold text-gray-900 ${textSizeClasses[size]}`}>
          Fashion<span className="text-pink-500">Up</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
