import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = 'md', showText = true, className = '' }: LogoProps) => {
  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showText && (
        <span
          className={`font-display font-semibold tracking-tight text-foreground ${textSizeClasses[size]}`}
        >
          FASHION<span className="italic font-normal text-accent">up</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
