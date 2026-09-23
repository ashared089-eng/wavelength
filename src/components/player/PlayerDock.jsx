import { Link, useLocation } from 'react-router-dom';
import { useDriftHold } from '../../context/DriftContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { TrackSleeve } from '../art/Sleeve.jsx';
import Swap from '../type/Swap.jsx';
import PlayerSheet from './PlayerSheet.jsx';
import SeekLine, { Clock } from './SeekLine.jsx';
import Transport from './Transport.jsx';

export default function PlayerDock() {
  const { currentTrack: track } = usePlayer();
  const { playerOpen, setPlayerOpen } = useUI();
  const location = useLocation();
  const holdProps = useDriftHold();

  if (!track) return null;
  const quiet = location.pathname === `/track/${track.id}` && !playerOpen;

  return (
    <>
      <PlayerSheet />
      <aside className="dock" data-quiet={quiet} data-open={playerOpen} aria-label="Player">
        <SeekLine className="dock__line" />
        <div className="dock__bar">
          <Link to={`/track/${track.id}`} className="dock__now" viewTransition data-cursor="Open" onClick={() => setPlayerOpen(false)}>
            <span className="dock__sleeve">
              <TrackSleeve track={track} imprint={false} />
            </span>
            <Swap swapKey={track.id} className="dock__text" exitMs={450}>
              <span className="dock__title">{track.title}</span>
              <span className="dock__artist">{track.artistName}</span>
            </Swap>
          </Link>
          <Clock className="dock__clock" fallback={track.duration} />
          <Transport className="dock__transport" size={18} />
          <button type="button" className="dock__drift" aria-label="Hold for a random record" data-cursor="Hold" {...holdProps}>
            Random
          </button>
          <button type="button" className="dock__toggle" onClick={() => setPlayerOpen(!playerOpen)} aria-expanded={playerOpen} aria-controls="sheet">
            {playerOpen ? 'Close' : 'Queue'}
          </button>
        </div>
      </aside>
    </>
  );
}
