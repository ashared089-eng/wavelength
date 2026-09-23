import { usePlayer } from '../../context/PlayerContext.jsx';
import { cx } from '../../utils/classNames.js';
import LineSlider from './LineSlider.jsx';

export default function VolumeLine({ className }) {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer();
  const shown = isMuted ? 0 : volume;

  return (
    <div className={cx('volume', className)}>
      <button type="button" className="volume__toggle" onClick={toggleMute} aria-pressed={isMuted}>
        {isMuted ? 'Muted' : 'Volume'}
      </button>
      <LineSlider
        className="volume__line"
        value={shown}
        max={1}
        step={0.05}
        bigStep={0.2}
        label="Volume"
        valueText={`${Math.round(shown * 100)} percent`}
        onScrub={setVolume}
        onCommit={setVolume}
      />
      <span className="volume__value">{String(Math.round(shown * 100)).padStart(2, '0')}</span>
    </div>
  );
}
