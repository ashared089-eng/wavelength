import { useEffect, useRef } from 'react';
import { usePlayerEngine } from '../../context/PlayerContext.jsx';

const COUNT = 70;

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export default function Particles({ color, active }) {
  const ref = useRef(null);
  const engine = usePlayerEngine();
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [red, green, blue] = hexToRgb(color);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let frame = 0;
    let level = 0;
    let bins = null;

    const motes = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      depth: 0.25 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.00022,
      vy: -(0.00008 + Math.random() * 0.00026),
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const readLevel = () => {
      const analyser = engine.analyser;
      if (!analyser || !activeRef.current) return 0;
      if (!bins || bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 0; i < 48; i += 1) sum += bins[i];
      return Math.min(1, (sum / 48 / 255) * 1.8);
    };

    const draw = (time) => {
      level += (readLevel() - level) * 0.12;
      const speed = activeRef.current ? 1 + level * 2.2 : 0.35;
      context.clearRect(0, 0, width, height);
      for (const mote of motes) {
        mote.x = (mote.x + mote.vx * speed + 1) % 1;
        mote.y = (mote.y + mote.vy * speed + 1) % 1;
        const twinkle = 0.6 + Math.sin(time * 0.0012 + mote.phase) * 0.4;
        const radius = (1 + mote.depth * 3.2) * (1 + level * 0.9);
        const alpha = mote.depth * twinkle * (0.16 + level * 0.6);
        context.beginPath();
        context.arc(mote.x * width, mote.y * height, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
        context.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [color, engine]);

  return <canvas ref={ref} className="fx-particles" aria-hidden="true" />;
}
