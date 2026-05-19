import React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingNavButtonProps {
  isNavbarVisible: boolean;
  onToggle: () => void;
}

/**
 * Floating Menu Trigger Button
 * - Plain minimalist design (no background by default)
 * - Bottom-left corner positioning
 * - Toggles navbar visibility
 * - Shows light gray background on hover with pulsing effect
 * - Highest z-index to always appear on top
 */
const FloatingNavButton: React.FC<FloatingNavButtonProps> = ({
  isNavbarVisible,
  onToggle,
}) => {
  return (
    <>
      <style>{`
        @keyframes pulse-fade {
          0%, 100% { 
            background-color: rgba(0, 0, 0, 0);
            opacity: 1;
          }
          50% { 
            background-color: rgba(0, 0, 0, 0.08);
            opacity: 0.7;
          }
        }
        .pulse-fade-hover:hover {
          animation: pulse-fade 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <button
        onClick={onToggle}
        aria-label={isNavbarVisible ? 'Hide navigation' : 'Show navigation'}
        className={cn(
          'pulse-fade-hover',
          'fixed bottom-1 left-1 z-50',
          'w-10 h-10 rounded-full',
          'flex items-center justify-center',
          'text-foreground',
          'transition-all duration-200 ease-out',
        )}>
        {isNavbarVisible ? (
          <X className="w-5 h-5 stroke-[1.5]" />
        ) : (
          <Menu className="w-5 h-5 stroke-[1.5]" />
        )}
      </button>
    </>
  );
};

export default FloatingNavButton;
