import { useEffect, useMemo, useRef } from 'react';

const TAP_MS = 230;
const HOLD_MS = 1500;
const INTERACTIVE = 'input, textarea, select, button, a, summary, [contenteditable="true"], [role="slider"]';

function isInteractive(target) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE));
}

export function useDrift({ onTap, onComplete, enabled = true }) {
  const callbacks = useRef({ onTap, onComplete });
  callbacks.current = { onTap, onComplete };
  const session = useRef(null);

  const api = useMemo(() => {
    const root = document.documentElement;
    const write = (value) => root.style.setProperty('--drift', value.toFixed(4));
    let release = 0;

    const settle = (from) => {
      const started = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - started) / 460);
        write(from * (1 - t) ** 3);
        if (t < 1) {
          release = requestAnimationFrame(step);
        } else {
          write(0);
          delete root.dataset.drift;
        }
      };
      release = requestAnimationFrame(step);
    };

    const begin = (source) => {
      if (session.current) return;
      cancelAnimationFrame(release);
      const current = { source, started: performance.now(), frame: 0, progress: 0 };
      session.current = current;
      const step = (now) => {
        const elapsed = now - current.started;
        if (elapsed > TAP_MS) root.dataset.drift = 'charging';
        current.progress = Math.min(1, Math.max(0, (elapsed - TAP_MS) / (HOLD_MS - TAP_MS)));
        write(current.progress);
        if (current.progress >= 1) {
          session.current = null;
          root.dataset.drift = 'released';
          callbacks.current.onComplete?.();
          window.setTimeout(() => settle(1), 420);
          return;
        }
        current.frame = requestAnimationFrame(step);
      };
      current.frame = requestAnimationFrame(step);
    };

    const end = (source, allowTap) => {
      const current = session.current;
      if (!current || current.source !== source) return;
      session.current = null;
      cancelAnimationFrame(current.frame);
      if (performance.now() - current.started < TAP_MS) {
        write(0);
        delete root.dataset.drift;
        if (allowTap) callbacks.current.onTap?.();
        return;
      }
      settle(current.progress);
    };

    const cancel = () => {
      const current = session.current;
      if (current) end(current.source, false);
    };

    return { begin, end, cancel };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isInteractive(event.target)) return;
      event.preventDefault();
      if (!event.repeat) api.begin('key');
    };
    const handleKeyUp = (event) => {
      if (event.code === 'Space') api.end('key', true);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', api.cancel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', api.cancel);
      api.cancel();
    };
  }, [api, enabled]);

  return useMemo(
    () => ({
      onPointerDown: (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        api.begin('pointer');
      },
      onPointerUp: () => api.end('pointer', false),
      onPointerCancel: () => api.end('pointer', false),
      onLostPointerCapture: () => api.end('pointer', false),
      onContextMenu: (event) => event.preventDefault(),
      onKeyDown: (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault();
          api.begin('button');
        }
      },
      onKeyUp: (event) => {
        if (event.key === 'Enter' || event.key === ' ') api.end('button', false);
      },
    }),
    [api],
  );
}
