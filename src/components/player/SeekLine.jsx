import { useState } from 'react';
import { usePlayer, useProgress } from '../../context/PlayerContext.jsx';
import { formatDuration } from '../../utils/format.js';
import LineSlider from './LineSlider.jsx';

export default function SeekLine({ className, inactive = false, tooltip = true }) {
  const { currentTime, duration } = useProgress();
  const { seek, currentTrack } = usePlayer();
  const [scrub, setScrub] = useState(null);

  const total = inactive ? 1 : duration || currentTrack?.duration || 1;
  const shown = inactive ? 0 : Math.min(scrub ?? currentTime, total);

  return (
    <LineSlider
      className={className}
      value={shown}
      max={total}
      step={5}
      bigStep={30}
      label="Seek"
      valueText={`${formatDuration(shown)} of ${formatDuration(total)}`}
      disabled={inactive || !currentTrack}
      formatTooltip={tooltip ? formatDuration : undefined}
      onScrub={setScrub}
      onCommit={(value) => {
        seek(value);
        setScrub(null);
      }}
    />
  );
}

export function Clock({ className, inactive = false, fallback = 0 }) {
  const { currentTime, duration } = useProgress();
  return (
    <span className={className}>
      <span>{formatDuration(inactive ? 0 : currentTime)}</span>
      <span aria-hidden="true"> / </span>
      <span>{formatDuration(inactive ? fallback : duration || fallback)}</span>
    </span>
  );
}
