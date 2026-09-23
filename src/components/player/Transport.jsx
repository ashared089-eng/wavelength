import { usePlayer } from '../../context/PlayerContext.jsx';
import { cx } from '../../utils/classNames.js';
import { NextGlyph, PauseGlyph, PlayGlyph, PreviousGlyph } from '../ui/Glyphs.jsx';

export default function Transport({ className, size = 20 }) {
  const { isPlaying, togglePlay, next, previous, currentTrack } = usePlayer();
  const disabled = !currentTrack;

  return (
    <div className={cx('transport', className)} role="group" aria-label="Playback">
      <button type="button" className="transport__button" onClick={previous} disabled={disabled} aria-label="Previous track">
        <PreviousGlyph size={size} />
      </button>
      <button type="button" className="transport__button transport__button--play" onClick={togglePlay} disabled={disabled} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <PauseGlyph size={size + 2} /> : <PlayGlyph size={size + 2} />}
      </button>
      <button type="button" className="transport__button" onClick={next} disabled={disabled} aria-label="Next track">
        <NextGlyph size={size} />
      </button>
    </div>
  );
}
