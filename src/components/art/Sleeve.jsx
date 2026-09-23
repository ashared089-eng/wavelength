import { memo, useId, useMemo } from 'react';
import { DEFAULT_VISUAL } from '../../data/visuals.js';
import { cx } from '../../utils/classNames.js';
import { createRandom, hashString } from '../../utils/random.js';
import { MOTIFS } from './motifs.jsx';

const pad = (value) => String(value).padStart(2, '0');

function Sleeve({ visual = DEFAULT_VISUAL, seed = 'wavelength', variant = 0, title = '', catalogNo = '', year = '', side = '', imprint = true, label, className }) {
  const rawId = useId();
  const uid = `s${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const art = useMemo(() => {
    const random = createRandom(hashString(seed) + variant * 7919);
    const motif = MOTIFS[visual.motif] ?? MOTIFS.rings;
    return motif(random, visual, uid);
  }, [seed, variant, visual, uid]);

  const ink = visual.light ? '#1b1a17' : '#efe6da';

  return (
    <svg
      className={cx('sleeve', className)}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <defs>
        {art.defs}
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="1000" height="1000" fill={visual.ground} />
      <g className="sleeve__layer sleeve__layer--back">{art.back}</g>
      <g className="sleeve__layer sleeve__layer--mid">{art.mid}</g>
      <g className="sleeve__layer sleeve__layer--front">{art.front}</g>
      {imprint ? (
        <g className="sleeve__imprint" fill={ink}>
          <text x="58" y="82">{catalogNo}</text>
          <text x="942" y="82" textAnchor="end">
            {year}
          </text>
          <text x="58" y="950">{title.toUpperCase()}</text>
          <text x="942" y="950" textAnchor="end">
            {side}
          </text>
        </g>
      ) : null}
      <rect width="1000" height="1000" fill={`url(#${uid}-sheen)`} pointerEvents="none" />
    </svg>
  );
}

const MemoSleeve = memo(Sleeve);
export default MemoSleeve;

export function TrackSleeve({ track, ...rest }) {
  return (
    <MemoSleeve
      visual={track.visual}
      seed={track.recordId}
      variant={track.number - 1}
      title={track.title}
      catalogNo={track.catalogNo}
      year={track.year}
      side={`${pad(track.number)} / ${pad(track.recordSize)}`}
      {...rest}
    />
  );
}

export function RecordSleeve({ record, ...rest }) {
  return (
    <MemoSleeve
      visual={record.visual}
      seed={record.id}
      variant={0}
      title={record.title}
      catalogNo={record.catalogNo}
      year={record.year}
      side={record.format}
      {...rest}
    />
  );
}
