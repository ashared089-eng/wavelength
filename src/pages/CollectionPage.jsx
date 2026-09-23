import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecordSleeve, TrackSleeve } from '../components/art/Sleeve.jsx';
import Reveal from '../components/type/Reveal.jsx';
import SplitText from '../components/type/SplitText.jsx';
import { SoundBars } from '../components/ui/Glyphs.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { getRecordTracks, records, totals } from '../data/catalog.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useFinePointer } from '../hooks/useReducedMotion.js';
import { formatDuration, formatTotalDuration } from '../utils/format.js';

const VIEW_KEY = 'wavelength:collection-view';
const pad = (value) => String(value).padStart(2, '0');
const normalise = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function readView() {
  try {
    return window.sessionStorage.getItem(VIEW_KEY) === 'sleeves' ? 'sleeves' : 'index';
  } catch {
    return 'index';
  }
}

function HoverPreview({ track }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(track);

  useEffect(() => {
    if (track) setShown(track);
  }, [track]);

  useEffect(() => {
    const node = ref.current;
    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    const render = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      const tilt = Math.max(-8, Math.min(8, (targetX - x) * 0.06));
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      frame = Math.abs(targetX - x) > 0.2 || Math.abs(targetY - y) > 0.2 ? requestAnimationFrame(render) : 0;
    };
    const handleMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!frame) frame = requestAnimationFrame(render);
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="preview" data-visible={Boolean(track)} aria-hidden="true">
      <div className="preview__frame">{shown ? <TrackSleeve track={shown} /> : null}</div>
    </div>
  );
}

export default function CollectionPage() {
  const [view, setView] = useState(readView);
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);
  const deferredQuery = useDeferredValue(query);
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { setEnvironment } = useUI();
  const fine = useFinePointer();
  const compact = useMediaQuery('(max-width: 760px)');

  useDocumentTitle('Songs');

  useEffect(() => {
    setEnvironment(null);
  }, [setEnvironment]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(VIEW_KEY, view);
    } catch {}
  }, [view]);

  const groups = useMemo(() => {
    const needle = normalise(deferredQuery.trim());
    return records
      .map((record) => {
        const list = getRecordTracks(record.id);
        if (!needle) return { record, list };
        const recordMatches = normalise(`${record.title} ${record.artistName} ${record.genres.join(' ')} ${record.year}`).includes(needle);
        return { record, list: recordMatches ? list : list.filter((track) => normalise(track.title).includes(needle)) };
      })
      .filter((group) => group.list.length > 0);
  }, [deferredQuery]);

  const matchCount = groups.reduce((sum, group) => sum + group.list.length, 0);

  return (
    <div className="collection">
      <header className="collection__head">
        <p className="eyebrow">
          {totals.records} records — {totals.tracks} songs — {formatTotalDuration(totals.duration)}
        </p>
        <h1 className="collection__title">
          <SplitText text="Songs" />
        </h1>
        <div className="collection__tools">
          <label className="collection__filter">
            <span className="sr-only">Search the songs</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search songs, artists, genres, years"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <div className="collection__views" role="group" aria-label="View">
            <button type="button" className="textbutton" aria-pressed={view === 'index'} onClick={() => setView('index')}>
              List
            </button>
            <button type="button" className="textbutton" aria-pressed={view === 'sleeves'} onClick={() => setView('sleeves')}>
              Covers
            </button>
          </div>
        </div>
        <p className="collection__count" aria-live="polite">
          {deferredQuery.trim() ? `${matchCount} ${matchCount === 1 ? 'song' : 'songs'} found` : ''}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="collection__empty">
          Nothing matches “{deferredQuery.trim()}”. <button type="button" className="textbutton" onClick={() => setQuery('')}>Clear it</button>
        </p>
      ) : null}

      {view === 'sleeves' ? (
        <ul className="sleeves">
          {groups.map(({ record, list }, index) => (
            <Reveal as="li" key={record.id} className="sleeves__item" delay={(index % 4) * 70}>
              <Link
                to={`/track/${list[0].id}`}
                className="sleeves__link"
                viewTransition
                data-cursor="Play"
                onClick={() => playTrack(list[0])}
                onPointerEnter={() => setEnvironment(record.visual)}
              >
                <span className="sleeves__art">
                  <RecordSleeve record={record} />
                </span>
                <span className="sleeves__caption">
                  <span className="sleeves__no">{record.catalogNo}</span>
                  <span className="sleeves__title">{record.title}</span>
                  <span className="sleeves__artist">
                    {record.artistName}, {record.year}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="index" onPointerLeave={() => setHovered(null)}>
          {groups.map(({ record, list }) => (
            <Reveal as="section" key={record.id} className="index__record" aria-labelledby={`record-${record.id}`} onPointerEnter={() => setEnvironment(record.visual)}>
              <header className="index__header">
                <span className="index__catalog">{record.catalogNo}</span>
                <h2 id={`record-${record.id}`} className="index__record-title">
                  {record.title}
                </h2>
                <p className="index__record-meta">
                  <span>{record.artistName}</span>
                  <span>
                    {record.year} · {record.format} · {formatTotalDuration(record.totalDuration)}
                  </span>
                </p>
                {compact ? (
                  <span className="index__thumb" aria-hidden="true">
                    <RecordSleeve record={record} imprint={false} />
                  </span>
                ) : null}
              </header>
              <ol className="index__list">
                {list.map((track) => {
                  const current = currentTrack?.id === track.id;
                  return (
                    <li key={track.id}>
                      <Link
                        to={`/track/${track.id}`}
                        className="index__row"
                        viewTransition
                        aria-current={current ? 'true' : undefined}
                        onClick={() => playTrack(track)}
                        onPointerEnter={() => setHovered(track)}
                        onFocus={() => setHovered(null)}
                      >
                        <span className="index__no">{current ? <SoundBars active={isPlaying} /> : pad(track.number)}</span>
                        <span className="index__track">{track.title}</span>
                        <span className="index__time">{formatDuration(track.duration)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          ))}
        </div>
      )}

      {fine && view === 'index' ? <HoverPreview track={hovered} /> : null}
    </div>
  );
}
