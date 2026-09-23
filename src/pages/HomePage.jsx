import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useViewTransitionState } from 'react-router-dom';
import { TrackSleeve } from '../components/art/Sleeve.jsx';
import SplitText from '../components/type/SplitText.jsx';
import Swap from '../components/type/Swap.jsx';
import { ArrowGlyph, PauseGlyph, PlayGlyph, SoundBars } from '../components/ui/Glyphs.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useEnvironment, useUI } from '../context/UIContext.jsx';
import { stageSides } from '../data/catalog.js';
import { useAudioReactive } from '../hooks/useAudioReactive.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useMagnetic } from '../hooks/useMagnetic.js';
import { usePointerParallax } from '../hooks/usePointerParallax.js';
import { clamp } from '../utils/array.js';
import { formatDuration } from '../utils/format.js';
import { titleSize } from '../utils/typeScale.js';

const STORAGE_KEY = 'wavelength:stage';
const OFFSETS = [-2, -1, 0, 1, 2];
const WHEEL_LOCK_MS = 900;
const SWIPE_DISTANCE = 70;

const pad = (value) => String(value).padStart(2, '0');

function readIndex(total) {
  try {
    const stored = Number(window.sessionStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored) && stored >= 0 && stored < total ? stored : 0;
  } catch {
    return 0;
  }
}

function FocusedSleeve({ side, onOpen }) {
  const to = `/track/${side.id}`;
  const transitioning = useViewTransitionState(to);
  return (
    <Link
      to={to}
      className="stage__sleeve"
      viewTransition
      draggable={false}
      data-cursor="Open"
      aria-label={`Open ${side.title} by ${side.artistName}`}
      style={{ viewTransitionName: transitioning ? 'sleeve' : 'none' }}
      onClick={onOpen}
    >
      <TrackSleeve track={side} className="sleeve--live" />
    </Link>
  );
}

function ArrowButton({ direction, onClick, label }) {
  const ref = useRef(null);
  useMagnetic(ref, 0.4, 1.2);
  return (
    <button ref={ref} type="button" className={`stage__arrow stage__arrow--${direction}`} onClick={onClick} aria-label={label}>
      <ArrowGlyph direction={direction === 'next' ? 'right' : 'left'} size={22} />
    </button>
  );
}

export default function HomePage() {
  const sides = stageSides;
  const total = sides.length;
  const [index, setIndex] = useState(() => readIndex(total));
  const [direction, setDirection] = useState('forward');
  const [dragging, setDragging] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { primaryAction, playerOpen, menuOpen, introSeen } = useUI();
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const railRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, delta: 0, moved: false });

  const focused = sides[index];
  const focusedIsCurrent = currentTrack?.id === focused.id;
  const focusedIsPlaying = focusedIsCurrent && isPlaying;

  useDocumentTitle('');
  useEnvironment(focused.visual);
  usePointerParallax(stageRef);
  useAudioReactive(railRef, focusedIsCurrent);

  const go = useCallback(
    (delta) => {
      if (!delta) return;
      setDirection(delta > 0 ? 'forward' : 'back');
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  const goTo = useCallback(
    (target) => {
      setIndex((current) => {
        if (target === current) return current;
        const forward = (target - current + total) % total;
        setDirection(forward <= total / 2 ? 'forward' : 'back');
        return target;
      });
    },
    [total],
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(index));
    } catch {}
  }, [index]);

  useEffect(() => {
    primaryAction.current = () => {
      if (currentTrack) return false;
      playTrack(focused);
      return true;
    };
    return () => {
      primaryAction.current = null;
    };
  }, [primaryAction, currentTrack, playTrack, focused]);

  useEffect(() => {
    const node = stageRef.current;
    let locked = false;
    let travel = 0;
    let reset = 0;
    let unlock = 0;
    const handleWheel = (event) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      if (locked) return;
      travel += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        travel = 0;
      }, 180);
      if (Math.abs(travel) < 46) return;
      go(travel > 0 ? 1 : -1);
      travel = 0;
      locked = true;
      unlock = window.setTimeout(() => {
        locked = false;
      }, WHEEL_LOCK_MS);
    };
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheel);
      window.clearTimeout(reset);
      window.clearTimeout(unlock);
    };
  }, [go]);

  useEffect(() => {
    if (playerOpen || menuOpen || !introSeen) return undefined;
    const handleKey = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, [role="slider"]')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'Enter' && !target?.closest('a, button')) {
        event.preventDefault();
        playTrack(focused);
        navigate(`/track/${focused.id}`, { viewTransition: true });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go, playerOpen, menuOpen, introSeen, playTrack, focused, navigate]);

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.stage__ticks, .stage__actions, .stage__arrow')) return;
    drag.current = { active: true, startX: event.clientX, delta: 0, moved: false };
  };
  const handlePointerMove = (event) => {
    const state = drag.current;
    if (!state.active) return;
    state.delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(state.delta) > 8) {
      state.moved = true;
      setDragging(true);
    }
    if (state.moved) railRef.current?.style.setProperty('--drag', `${clamp(state.delta * 0.6, -260, 260).toFixed(1)}px`);
  };
  const endDrag = () => {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;
    setDragging(false);
    railRef.current?.style.setProperty('--drag', '0px');
    if (Math.abs(state.delta) > SWIPE_DISTANCE) go(state.delta < 0 ? 1 : -1);
  };
  const handleClickCapture = (event) => {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePlay = () => {
    if (focusedIsCurrent) togglePlay();
    else playTrack(focused);
  };

  return (
    <section
      ref={stageRef}
      className="stage"
      data-direction={direction}
      data-dragging={dragging}
      aria-roledescription="carousel"
      aria-label="One song from every record"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}
    >
      <Swap swapKey={focused.id} exitMs={1100} className="stage__atmos" aria-hidden="true">
        <TrackSleeve track={focused} imprint={false} />
      </Swap>

      <div className="stage__folio" aria-hidden="true">
        <Swap swapKey={index} exitMs={700} as="span" className="roll">
          <span>{pad(index + 1)}</span>
        </Swap>
      </div>

      <div ref={railRef} className="stage__rail">
        {OFFSETS.map((offset) => {
          const side = sides[(index + offset + total) % total];
          const isFocused = offset === 0;
          return (
            <div key={side.id} className="stage__slide" data-focused={isFocused} style={{ '--offset': offset, '--abs': Math.abs(offset) }}>
              {isFocused ? (
                <>
                  <FocusedSleeve side={side} onOpen={() => playTrack(side)} />
                  <span className="stage__reflection" aria-hidden="true">
                    <TrackSleeve track={side} imprint={false} />
                  </span>
                </>
              ) : (
                <button type="button" className="stage__sleeve" tabIndex={-1} aria-hidden="true" data-cursor={offset > 0 ? 'Next' : 'Back'} onClick={() => go(offset)}>
                  <TrackSleeve track={side} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="stage__headline">
        <Swap swapKey={focused.id} exitMs={700}>
          <h1 className="stage__title" style={{ '--title-size': titleSize(focused.title) }}>
            <SplitText text={focused.title} />
          </h1>
        </Swap>
      </div>

      <div className="stage__count" aria-live="polite" aria-atomic="true">
        <span className="sr-only">Record </span>
        <Swap swapKey={index} exitMs={500} as="span" className="stage__count-now roll">
          <span>{pad(index + 1)}</span>
        </Swap>
        <span className="stage__count-total">/ {pad(total)}</span>
        <SoundBars active={focusedIsPlaying} />
      </div>

      <div className="stage__meta">
        <Swap swapKey={focused.id} exitMs={500}>
          <p className="stage__artist">{focused.artistName}</p>
          <p className="stage__record">
            {focused.recordTitle}
            <span aria-hidden="true"> · </span>
            {focused.year}
            <span aria-hidden="true"> · </span>
            {focused.format}
          </p>
        </Swap>
      </div>

      <div className="stage__actions">
        <button type="button" className="stage__play" onClick={handlePlay} aria-label={focusedIsPlaying ? `Pause ${focused.title}` : `Play ${focused.title}`}>
          {focusedIsPlaying ? <PauseGlyph size={16} /> : <PlayGlyph size={16} />}
          <span>{focusedIsPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <span className="stage__duration">{formatDuration(focused.duration)}</span>
        <Link to={`/track/${focused.id}`} className="stage__open" viewTransition onClick={() => playTrack(focused)}>
          <span>Open</span>
          <ArrowGlyph size={16} />
        </Link>
      </div>

      <ArrowButton direction="previous" onClick={() => go(-1)} label="Previous record" />
      <ArrowButton direction="next" onClick={() => go(1)} label="Next record" />

      <ol className="stage__ticks" aria-label="All records">
        {sides.map((side, position) => (
          <li key={side.id}>
            <button
              type="button"
              className="stage__tick"
              aria-label={`${side.title} — ${side.artistName}`}
              aria-current={position === index ? 'true' : undefined}
              data-label={side.title}
              style={{ '--tick': side.visual.a }}
              onClick={() => goTo(position)}
            >
              <span />
            </button>
          </li>
        ))}
      </ol>

      <p className="stage__hint" aria-hidden="true">
        <span className="stage__hint-desktop">scroll or drag · space plays · hold space for a random one</span>
        <span className="stage__hint-touch">swipe · tap the cover to open it</span>
      </p>
    </section>
  );
}
