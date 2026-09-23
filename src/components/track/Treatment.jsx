import { TrackSleeve } from '../art/Sleeve.jsx';
import Particles from './Particles.jsx';

export function Backdrop({ track, active }) {
  const kind = track.visual.treatment;

  if (kind === 'pan') {
    return (
      <div className="fx-pan" aria-hidden="true">
        <div className="fx-pan__band">
          <TrackSleeve track={track} imprint={false} />
          <TrackSleeve track={track} imprint={false} />
          <TrackSleeve track={track} imprint={false} />
        </div>
      </div>
    );
  }
  if (kind === 'particles') return <Particles color={track.visual.c} active={active} />;
  if (kind === 'grain') return <span className="fx-grain" aria-hidden="true" />;
  return null;
}

export function SleeveEffects({ track }) {
  const kind = track.visual.treatment;

  if (kind === 'rings') {
    return (
      <span className="fx-rings" aria-hidden="true">
        {[0, 1, 2, 3].map((ring) => (
          <i key={ring} style={{ '--i': ring }} />
        ))}
      </span>
    );
  }
  if (kind === 'layers') {
    return (
      <>
        <span className="fx-ghost fx-ghost--far" aria-hidden="true">
          <TrackSleeve track={track} imprint={false} />
        </span>
        <span className="fx-ghost fx-ghost--near" aria-hidden="true">
          <TrackSleeve track={track} imprint={false} />
        </span>
      </>
    );
  }
  return null;
}

export function SleeveOverlay({ track }) {
  if (track.visual.treatment !== 'light') return null;
  return <span className="fx-light" aria-hidden="true" />;
}
