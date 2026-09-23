import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerEngine } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { totals } from '../../data/catalog.js';
import SplitText from '../type/SplitText.jsx';

function buildWave() {
  const points = [];
  for (let x = 0; x <= 1200; x += 8) {
    const t = x / 1200;
    const envelope = Math.sin(Math.PI * t) ** 2;
    const y = 60 + Math.sin(t * Math.PI * 14) * 40 * envelope;
    points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(2)}`);
  }
  return points.join(' ');
}

const WAVE = buildWave();

export default function Intro() {
  const { introSeen, finishIntro } = useUI();
  const engine = usePlayerEngine();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState('enter');
  const buttonRef = useRef(null);

  useEffect(() => {
    if (introSeen) return undefined;
    const timer = window.setTimeout(() => setPhase((current) => (current === 'enter' ? 'ready' : current)), reduced ? 100 : 1500);
    return () => window.clearTimeout(timer);
  }, [introSeen, reduced]);

  useEffect(() => {
    if (phase === 'ready') buttonRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const enter = useCallback(() => {
    if (phase === 'leave') return;
    engine.prime();
    setPhase('leave');
    window.setTimeout(finishIntro, reduced ? 150 : 1150);
  }, [phase, engine, finishIntro, reduced]);

  useEffect(() => {
    if (introSeen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        enter();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [introSeen, enter]);

  if (introSeen) return null;

  return (
    <div className="intro" data-phase={phase} role="dialog" aria-modal="true" aria-label="Welcome to Wavelength">
      <span className="intro__curtain intro__curtain--top" aria-hidden="true" />
      <span className="intro__curtain intro__curtain--bottom" aria-hidden="true" />
      <div className="intro__body">
        <p className="intro__eyebrow">yo. headphones on.</p>
        <h1 className="intro__mark">
          <SplitText text="Wavelength" />
        </h1>
        <svg className="intro__wave" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d={WAVE} pathLength="1" />
        </svg>
        <p className="intro__note">
          {totals.records} records, {totals.tracks} songs, all made up live in your browser. <em>Turn it up.</em>
        </p>
        <button ref={buttonRef} type="button" className="intro__enter" onClick={enter}>
          <span>Let&rsquo;s go</span>
        </button>
        <p className="intro__hint">or just hit space</p>
      </div>
    </div>
  );
}
