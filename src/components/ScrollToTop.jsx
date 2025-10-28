import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Scrolls to top on route change, but respects browser back/forward navigation
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Don't scroll if there's a hash (let the browser handle anchor links)
    if (hash) {
      return;
    }

    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

