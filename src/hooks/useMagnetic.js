import { useEffect } from 'react';

export function useMagnetic(ref, strength = 0.32, reach = 1.5) {
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
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      const settled = Math.abs(targetX - x) < 0.05 && Math.abs(targetY - y) < 0.05;
      frame = settled ? 0 : requestAnimationFrame(render);
      if (settled && targetX === 0 && targetY === 0) node.style.transform = '';
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const handleMove = (event) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2 - x);
      const dy = event.clientY - (rect.top + rect.height / 2 - y);
      const limit = Math.max(rect.width, rect.height) * reach;
      const inside = Math.hypot(dx, dy) < limit;
      targetX = inside ? dx * strength : 0;
      targetY = inside ? dy * strength : 0;
      wake();
    };
    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
      wake();
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.documentElement.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(frame);
      node.style.transform = '';
    };
  }, [ref, strength, reach]);
}
