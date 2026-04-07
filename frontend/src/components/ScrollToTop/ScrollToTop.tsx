import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    // Admin/vendor panels manage their own scroll containers
    if (pathname.startsWith('/admin') || pathname.startsWith('/vendor')) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const raf = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
