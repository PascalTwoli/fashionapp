import { useState, useEffect } from 'react';

interface ScrollState {
  isScrolling: boolean;
  scrollDirection: 'up' | 'down' | 'idle';
  lastScrollY: number;
}

export const useScrollDetection = () => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    isScrolling: false,
    scrollDirection: 'idle',
    lastScrollY: 0,
  });

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = scrollState.lastScrollY;

      const direction: 'up' | 'down' | 'idle' = 
        currentScrollY > lastScrollY ? 'down' : currentScrollY < lastScrollY ? 'up' : 'idle';

      setScrollState((prev) => ({
        ...prev,
        isScrolling: true,
        scrollDirection: direction,
        lastScrollY: currentScrollY,
      }));

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Set idle state after 1.5 seconds of no scrolling
      scrollTimeout = setTimeout(() => {
        setScrollState((prev) => ({
          ...prev,
          isScrolling: false,
          scrollDirection: 'idle',
        }));
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollState.lastScrollY]);

  return scrollState;
};
