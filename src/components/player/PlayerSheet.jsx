import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAudioReactive } from '../../hooks/useAudioReactive.js';
import { formatDuration } from '../../utils/format.js';
import { TrackSleeve } from '../art/Sleeve.jsx';
import SplitText from '../type/SplitText.jsx';
import Swap from '../type/Swap.jsx';
import { ArrowGlyph } from '../ui/Glyphs.jsx';
import SeekLine, { Clock } from './SeekLine.jsx';
import Transport from './Transport.jsx';
import VolumeLine from './VolumeLine.jsx';

const pad = (value) => String(value).padStart(2, '0');
const REPEAT_LABELS = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };

export default function PlayerSheet() {
  const { currentTrack: track, queue, currentIndex, context, shuffle, repeat, toggleShuffle, cycleRepeat, jumpTo } = usePlayer();
  const { playerOpen, setPlayerOpen } = useUI();
  const visualRef = useRef(null);
  const touchStart = useRef(null);
  useAudioReactive(visualRef, playerOpen);

  if (!track) return null;

  const handleTouchStart = (event) => {
    touchStart.current = event.touches[0].clientY;
  };
  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientY - touchStart.current;
    touchStart.current = null;
    if (delta > 90) setPlayerOpen(false);
  };

  return (
    <section
      id="sheet"
      className="sheet"
      data-open={playerOpen}
      inert={!playerOpen}
      aria-label="Now playing"
      style={{ '--a': track.visual.a, '--b': track.visual.b }}
    >
      <div className="sheet__grab" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-hidden="true">
        <span />
      </div>
      <div className="sheet__visual" ref={visualRef}>
        <Swap swapKey={track.id} className="sheet__sleeve" exitMs={600}>
          <TrackSleeve track={track} label={`Cover for ${track.title}`} />
        </Swap>
      </div>
      <div className="sheet__main">
        <p className="eyebrow">
          {track.catalogNo} — {track.recordTitle} — {track.year}
        </p>
        <Swap swapKey={track.id} exitMs={500}>
          <h2 className="sheet__title">
            <SplitText text={track.title} by="word" />
          </h2>
        </Swap>
        <p className="sheet__artist">{track.artistName}</p>
        <div className="sheet__seek">
          <SeekLine className="line--large" />
          <Clock className="sheet__clock" fallback={track.duration} />
        </div>
        <div className="sheet__controls">
          <Transport size={24} />
          <div className="sheet__modes">
            <button type="button" className="textbutton" onClick={toggleShuffle} aria-pressed={shuffle}>
              Shuffle
            </button>
            <button type="button" className="textbutton" onClick={cycleRepeat} aria-pressed={repeat !== 'off'}>
              {REPEAT_LABELS[repeat]}
            </button>
          </div>
        </div>
        <VolumeLine />
        <Link to={`/track/${track.id}`} className="sheet__enter" viewTransition onClick={() => setPlayerOpen(false)}>
          <span>Open this song</span>
          <ArrowGlyph size={18} />
        </Link>
      </div>
      <div className="sheet__queue">
        <p className="eyebrow">Up next{context?.name ? ` — ${context.name}` : ''}</p>
        <ol>
          {queue.map((item, index) => (
            <li key={item.queueId}>
              <button type="button" className="sheet__row" aria-current={index === currentIndex ? 'true' : undefined} onClick={() => jumpTo(index)}>
                <span className="sheet__row-no">{pad(index + 1)}</span>
                <span className="sheet__row-title">{item.title}</span>
                <span className="sheet__row-time">{formatDuration(item.duration)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
