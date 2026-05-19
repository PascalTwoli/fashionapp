import { useState, useCallback } from 'react';

export const useNavbarVisibility = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true); // Default: OPEN
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);

  const toggleNavbar = useCallback(() => {
    if (isManuallyHidden) {
      // If manually hidden, show and mark as not manually hidden
      setIsNavbarVisible(true);
      setIsManuallyHidden(false);
    } else {
      // If visible, hide and mark as manually hidden
      setIsNavbarVisible(false);
      setIsManuallyHidden(true);
    }
  }, [isManuallyHidden]);

  const handleScroll = useCallback((scrollDirection: 'up' | 'down' | 'idle') => {
    // Only auto-hide/show if NOT manually hidden
    if (!isManuallyHidden) {
      if (scrollDirection === 'down') {
        setIsNavbarVisible(false); // Hide on scroll down
      } else if (scrollDirection === 'up' || scrollDirection === 'idle') {
        setIsNavbarVisible(true); // Show on scroll up or idle
      }
    }
  }, [isManuallyHidden]);

  return {
    isNavbarVisible,
    isManuallyHidden,
    toggleNavbar,
    handleScroll,
  };
};
