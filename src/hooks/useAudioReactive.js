import { useEffect } from 'react';
import { usePlayer, usePlayerEngine } from '../context/PlayerContext.jsx';

export function useAudioReactive(ref, active = true) {
  const engine = usePlayerEngine();
  const { isPlaying } = usePlayer();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active || !isPlaying || reduced) {
      node.style.setProperty('--level', '0');
      node.style.setProperty('--bass', '0');
      return undefined;
    }

    let frame = 0;
    let level = 0;
    let bass = 0;
    let skip = false;
    let bins = null;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      skip = !skip;
      if (skip) return;
      const analyser = engine.analyser;
      let targetLevel = 0;
      let targetBass = 0;
      if (analyser) {
        if (!bins || bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        let low = 0;
        for (let i = 1; i < 6; i += 1) low += bins[i];
        let all = 0;
        const span = Math.min(64, bins.length);
        for (let i = 0; i < span; i += 1) all += bins[i];
        targetBass = Math.min(1, (low / 5 / 255) * 1.25);
        targetLevel = Math.min(1, (all / span / 255) * 1.9);
      } else {
        const tempo = engine.composition?.bpm ?? 100;
        const phase = ((engine.currentTime * tempo) / 60) % 1;
        targetBass = Math.max(0, 1 - phase * 3);
        targetLevel = 0.35 + targetBass * 0.3;
      }
      bass += (targetBass - bass) * (targetBass > bass ? 0.55 : 0.12);
      level += (targetLevel - level) * 0.18;
      node.style.setProperty('--level', level.toFixed(3));
      node.style.setProperty('--bass', bass.toFixed(3));
    };

    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--level', '0');
      node.style.setProperty('--bass', '0');
    };
  }, [ref, engine, isPlaying, active]);
}
