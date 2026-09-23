import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TrackSleeve } from '../components/art/Sleeve.jsx';
import SeekLine, { Clock } from '../components/player/SeekLine.jsx';
import LinerNotes from '../components/track/LinerNotes.jsx';
import { Backdrop, SleeveEffects, SleeveOverlay } from '../components/track/Treatment.jsx';
import Reveal from '../components/type/Reveal.jsx';
import SplitText from '../components/type/SplitText.jsx';
import Swap from '../components/type/Swap.jsx';
import { ArrowGlyph, PauseGlyph, PlayGlyph, SoundBars } from '../components/ui/Glyphs.jsx';
import { useDriftHold } from '../context/DriftContext.jsx';
import { usePlayer, usePlayerEngine } from '../context/PlayerContext.jsx';
import { useEnvironment, useUI } from '../context/UIContext.jsx';
import { getArtist, getNeighbors, getRecord, getRecordTracks, getTrack } from '../data/catalog.js';
import { TREATMENT_NOTES } from '../data/visuals.js';
import { useAudioReactive } from '../hooks/useAudioReactive.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useMagnetic } from '../hooks/useMagnetic.js';
import { usePointerParallax } from '../hooks/usePointerParallax.js';
import { formatCompactNumber, formatDuration } from '../utils/format.js';
import { composeTrack } from '../utils/synth.js';
import { titleSize } from '../utils/typeScale.js';
import NotFoundPage from './NotFoundPage.jsx';

const SWIPE_DISTANCE = 80;
const pad = (value) => String(value).padStart(2, '0');
const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function PlayControl({ playing, onClick, label }) {
  const ref = useRef(null);
  useMagnetic(ref, 0.3, 1.1);
  return (
    <button ref={ref} type="button" className="world__play" onClick={onClick} aria-label={label} data-cursor={playing ? 'Pause' : 'Play'}>
      <span className="world__play-ring" aria-hidden="true" />
      {playing ? <PauseGlyph size={26} /> : <PlayGlyph size={26} />}
    </button>
  );
}

function World({ track }) {
  const { currentTrack, isPlaying: playerIsPlaying, playTrack, togglePlay } = usePlayer();
  const engine = usePlayerEngine();
  const { primaryAction } = useUI();
  const holdProps = useDriftHold();
  const navigate = useNavigate();
  const [notesOpen, setNotesOpen] = useState(false);
  const [submerged, setSubmerged] = useState(false);
  const heroRef = useRef(null);
  const touch = useRef(null);
  const followPaused = useRef(false);
  const lastCurrentId = useRef(currentTrack?.id);

  const record = getRecord(track.recordId);
  const artist = getArtist(track.artistId);
  const siblings = useMemo(() => getRecordTracks(track.recordId), [track.recordId]);
  const { previous, next } = useMemo(() => getNeighbors(track.id), [track.id]);
  const composition = useMemo(() => composeTrack(track), [track]);

  const isCurrent = currentTrack?.id === track.id;
  const isPlaying = isCurrent && playerIsPlaying;

  useDocumentTitle(`${track.title} — ${track.artistName}`);
  useEnvironment(track.visual);
  usePointerParallax(heroRef);
  useAudioReactive(heroRef, isCurrent);

  useEffect(() => {
    const currentId = currentTrack?.id;
    const before = lastCurrentId.current;
    lastCurrentId.current = currentId;
    if (followPaused.current) {
      followPaused.current = false;
      return;
    }
    if (before === track.id && currentId && currentId !== track.id) {
      navigate(`/track/${currentId}`, { replace: true });
    }
  }, [currentTrack, track.id, navigate]);

  useEffect(() => {
    primaryAction.current = () => {
      if (isCurrent) return false;
      playTrack(track);
      return true;
    };
    return () => {
      primaryAction.current = null;
    };
  }, [primaryAction, isCurrent, playTrack, track]);

  useEffect(() => () => engine.setVeil(0), [engine]);

  useEffect(() => {
    followPaused.current = false;
    setNotesOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [track.id]);

  const submerge = useCallback(
    (on) => {
      setSubmerged(on);
      engine.setVeil(on ? 1 : 0);
    },
    [engine],
  );

  const travel = useCallback(
    (target) => {
      if (target.id === track.id) return;
      if (playerIsPlaying || !currentTrack) {
        followPaused.current = true;
        playTrack(target);
      }
      navigate(`/track/${target.id}`);
    },
    [track.id, playerIsPlaying, currentTrack, playTrack, navigate],
  );

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playTrack(track);
  };

  const handleTouchStart = (event) => {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  };
  const handleTouchEnd = (event) => {
    if (!touch.current) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.6) travel(dx < 0 ? next : previous);
  };

  const facts = [
    ['Length', formatDuration(track.duration)],
    ['BPM', composition.bpm],
    ['Key', `${composition.tonic} ${capitalise(composition.mode)}`],
    ['Vibe', capitalise(composition.styleName)],
    ['Animation', TREATMENT_NOTES[track.visual.treatment]],
    ['Album', `${track.recordTitle} (${track.format})`],
    ['Cat no.', track.catalogNo],
    ['Label', track.label],
    ['Year', track.year],
    ['Plays', formatCompactNumber(track.plays)],
  ];

  return (
    <article
      className="world"
      data-treatment={track.visual.treatment}
      data-playing={isPlaying}
      data-submerged={submerged}
      style={{
        '--a': track.visual.a,
        '--b': track.visual.b,
        '--c': track.visual.c,
        '--ground': track.visual.ground,
        '--beat': `${(60 / composition.bpm).toFixed(4)}s`,
      }}
    >
      <section ref={heroRef} className="world__hero" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <Swap swapKey={track.id} exitMs={900} className="world__backdrop">
          <Backdrop track={track} active={isPlaying} />
        </Swap>

        <div className="world__live">
          <Swap swapKey={track.id} exitMs={900} className="world__sleeve-swap">
            <div className="world__sleeve-wrap">
              <SleeveEffects track={track} />
              <button
                type="button"
                className="world__sleeve"
                aria-label="Hold to muffle the sound"
                aria-pressed={submerged}
                data-cursor="Hold"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  submerge(true);
                }}
                onPointerUp={() => submerge(false)}
                onPointerCancel={() => submerge(false)}
                onLostPointerCapture={() => submerge(false)}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) submerge(true);
                }}
                onKeyUp={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') submerge(false);
                }}
                onBlur={() => submerge(false)}
              >
                <TrackSleeve track={track} className="sleeve--live" label={`Cover for ${track.title}`} />
                <SleeveOverlay track={track} />
              </button>
            </div>
          </Swap>
        </div>

        <header className="world__head">
          <Swap swapKey={track.id} exitMs={700}>
            <p className="eyebrow world__eyebrow">
              <SoundBars active={isPlaying} />
              <span>
                {track.catalogNo} — track {pad(track.number)} of {pad(track.recordSize)}
              </span>
            </p>
            <h1 className="world__title" style={{ '--title-size': titleSize(track.title) }}>
              <SplitText text={track.title} />
            </h1>
            <p className="world__byline">
              <span className="world__artist">{track.artistName}</span>
              <span className="world__record">
                {track.recordTitle}, {track.year}
              </span>
            </p>
          </Swap>
        </header>

        <div className="world__controls">
          <PlayControl playing={isPlaying} onClick={handlePlay} label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`} />
          <div className="world__seek">
            <SeekLine className="line--large" inactive={!isCurrent} />
            <Clock className="world__clock" inactive={!isCurrent} fallback={track.duration} />
          </div>
          <div className="world__steps">
            <button type="button" className="textbutton" onClick={() => travel(previous)} aria-label={`Previous: ${previous.title}`}>
              <ArrowGlyph direction="left" size={16} />
              <span>Prev</span>
            </button>
            <button type="button" className="textbutton" onClick={() => travel(next)} aria-label={`Next: ${next.title}`}>
              <span>Next</span>
              <ArrowGlyph size={16} />
            </button>
          </div>
        </div>

        <div className="world__corner">
          <button type="button" className="textbutton world__drift" aria-label="Hold for a random record" data-cursor="Hold" {...holdProps}>
            Hold for a random one
          </button>
          <button type="button" className="textbutton" onClick={() => setNotesOpen(true)} aria-expanded={notesOpen}>
            <span>About the artist</span>
            <ArrowGlyph size={16} />
          </button>
        </div>
      </section>

      <section className="world__details" aria-label="About this track">
        <Reveal as="dl" className="facts">
          {facts.map(([term, value], index) => (
            <div key={term} className="facts__row" style={{ '--i': index }}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Reveal>

        <Reveal className="sides">
          <p className="eyebrow">
            {track.recordTitle} — {siblings.length} {siblings.length === 1 ? 'song' : 'songs'}
          </p>
          <ol className="sides__list">
            {siblings.map((sibling, index) => (
              <li key={sibling.id} style={{ '--i': index }}>
                <button type="button" className="sides__row" aria-current={sibling.id === track.id ? 'true' : undefined} onClick={() => travel(sibling)}>
                  <span className="sides__no">{pad(sibling.number)}</span>
                  <span className="sides__title">{sibling.title}</span>
                  <span className="sides__time">{formatDuration(sibling.duration)}</span>
                </button>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <footer className="world__next">
        <button type="button" className="world__next-link" onClick={() => travel(next)} data-cursor="Next">
          <span className="eyebrow">Next up — {next.artistName}</span>
          <span className="world__next-title">{next.title}</span>
          <span className="world__next-sleeve" aria-hidden="true">
            <TrackSleeve track={next} imprint={false} />
          </span>
        </button>
        <Link to="/collection" className="textbutton" viewTransition>
          <span>Back to all songs</span>
          <ArrowGlyph size={16} />
        </Link>
      </footer>

      <LinerNotes open={notesOpen} onClose={() => setNotesOpen(false)} track={track} record={record} artist={artist} />
    </article>
  );
}

export default function TrackPage() {
  const { trackId } = useParams();
  const track = getTrack(trackId);
  if (!track) return <NotFoundPage />;
  return <World track={track} />;
}
