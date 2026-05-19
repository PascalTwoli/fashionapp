import { useState, useCallback } from 'react';

export const useNavbarVisibility = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  const toggleNavbar = useCallback(() => {
    setIsNavbarVisible(prev => !prev);
  }, []);

  const handleScroll = useCallback((direction: 'up' | 'down' | 'idle') => {
    if (direction === 'down') {
      setIsNavbarVisible(false);
    }
  }, []);

  return {
    isNavbarVisible,
    toggleNavbar,
    handleScroll,
  };
};
