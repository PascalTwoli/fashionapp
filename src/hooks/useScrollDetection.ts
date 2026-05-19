import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

export const useScrollDetection = () => {
  const [scrollState, setScrollState] = useState<{
    scrollTop: number;
    scrollDirection: ScrollDirection;
  }>({
    scrollTop: 0,
    scrollDirection: 'idle',
  });

  useEffect(() => {
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      let direction: ScrollDirection = 'idle';
      if (currentScrollTop > lastScrollTop) {
        direction = 'down';
      } else if (currentScrollTop < lastScrollTop) {
        direction = 'up';
      }

      setScrollState({
        scrollTop: currentScrollTop,
        scrollDirection: direction,
      });

      lastScrollTop = currentScrollTop;

      // Reset to idle after a short delay
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrollState(prev => ({ ...prev, scrollDirection: 'idle' }));
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return scrollState;
};
