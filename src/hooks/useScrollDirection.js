import { useEffect, useState } from 'react';

export function useScrollDirection(threshold = 8) {
  const [state, setState] = useState({ direction: 'up', atTop: true });

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = window.scrollY;
      const delta = current - last;
      if (Math.abs(delta) < threshold && current > 4) return;
      const direction = delta > 0 ? 'down' : 'up';
      const atTop = current < 40;
      last = current;
      setState((previous) => (previous.direction === direction && previous.atTop === atTop ? previous : { direction, atTop }));
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return state;
}
