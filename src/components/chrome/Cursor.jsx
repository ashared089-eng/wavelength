import { useEffect, useRef, useState } from 'react';
import { useFinePointer, useReducedMotion } from '../../hooks/useReducedMotion.js';

export default function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const ringRef = useRef(null);
  const [label, setLabel] = useState('');
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fine) return undefined;
    const ring = ringRef.current;
    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    const ease = reduced ? 1 : 0.2;

    const render = () => {
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1 ? requestAnimationFrame(render) : 0;
    };
    const handleMove = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      setVisible(true);
      if (!frame) frame = requestAnimationFrame(render);
    };
    const handleOver = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const labelled = target?.closest('[data-cursor]');
      setLabel(labelled?.getAttribute('data-cursor') ?? '');
      setActive(Boolean(target?.closest('a, button, [role="slider"], input, summary')));
    };
    const handleLeave = () => setVisible(false);

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerover', handleOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerover', handleOver);
      document.documentElement.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(frame);
    };
  }, [fine, reduced]);

  if (!fine) return null;

  return (
    <div ref={ringRef} className="cursor" data-visible={visible} data-active={active} data-labelled={Boolean(label)} aria-hidden="true">
      <span className="cursor__ring">
        <span className="cursor__label">{label}</span>
      </span>
    </div>
  );
}
