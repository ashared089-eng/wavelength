import { useEffect } from 'react';

export function usePointerParallax(ref, ease = 0.06) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;

    const render = () => {
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      node.style.setProperty('--px', x.toFixed(4));
      node.style.setProperty('--py', y.toFixed(4));
      const settled = Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(render);
    };
    const handleMove = (event) => {
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = (event.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, [ref, ease]);
}
