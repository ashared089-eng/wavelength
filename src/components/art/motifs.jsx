import { mixHex } from '../../utils/random.js';

const TAU = Math.PI * 2;
const between = (r, min, max) => min + r() * (max - min);
const choose = (r, items) => items[Math.floor(r() * items.length)];
const polar = (cx, cy, radius, angle) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];

function arcPath(cx, cy, radius, from, to) {
  const [x1, y1] = polar(cx, cy, radius, from);
  const [x2, y2] = polar(cx, cy, radius, to);
  const large = Math.abs(to - from) > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function scatter(r, count, color, area = [60, 60, 940, 940], size = [2, 5]) {
  return Array.from({ length: count }, (_, i) => (
    <circle
      key={`dot-${i}`}
      cx={between(r, area[0], area[2])}
      cy={between(r, area[1], area[3])}
      r={between(r, size[0], size[1])}
      fill={color}
      opacity={between(r, 0.35, 0.9)}
    />
  ));
}

function sun(r, p, uid) {
  const cx = between(r, 430, 570);
  const cy = between(r, 420, 500);
  const radius = between(r, 250, 310);
  const bands = [];
  let y = cy + radius * 0.06;
  let height = 9;
  while (y < cy + radius) {
    bands.push(<rect key={`band-${bands.length}`} x={cx - radius - 12} y={y} width={radius * 2 + 24} height={height} fill={p.ground} />);
    y += height + between(r, 26, 34);
    height += 7;
  }
  const horizon = cy + radius + between(r, 24, 64);
  return {
    defs: (
      <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.b} />
        <stop offset="1" stopColor={p.a} />
      </linearGradient>
    ),
    back: [<circle key="halo" cx={cx} cy={cy} r={radius * 1.55} fill={p.a} opacity="0.16" />, ...scatter(r, 10, p.c, [60, 60, 940, cy - radius * 0.5])],
    mid: [<circle key="disc" cx={cx} cy={cy} r={radius} fill={`url(#${uid}-a)`} />, ...bands],
    front: [
      <line key="horizon" x1="0" x2="1000" y1={horizon} y2={horizon} stroke={p.c} strokeWidth="3" opacity="0.85" />,
      <ellipse key="echo" cx={cx} cy={horizon + 74} rx={radius * 0.72} ry="16" fill={p.b} opacity="0.32" />,
    ],
  };
}

function halfsun(r, p, uid) {
  const cx = between(r, 380, 620);
  const radius = between(r, 330, 410);
  const base = between(r, 690, 770);
  const rays = Array.from({ length: 19 }, (_, i) => {
    const angle = Math.PI + (i / 18) * Math.PI;
    const [x1, y1] = polar(cx, base, radius + 36, angle);
    const [x2, y2] = polar(cx, base, radius + between(r, 110, 270), angle);
    return <line key={`ray-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.c} strokeWidth="4" opacity="0.5" strokeLinecap="round" />;
  });
  return {
    defs: (
      <>
        <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.a} />
          <stop offset="0.5" stopColor={p.b} />
        </linearGradient>
        <clipPath id={`${uid}-c`}>
          <rect x="0" y="0" width="1000" height={base} />
        </clipPath>
      </>
    ),
    back: [<g key="rays" clipPath={`url(#${uid}-c)`}>{rays}</g>],
    mid: [<circle key="disc" cx={cx} cy={base} r={radius} fill={`url(#${uid}-a)`} clipPath={`url(#${uid}-c)`} />],
    front: [
      <rect key="band-a" x="0" y={base + 26} width="1000" height="12" fill={p.a} opacity="0.85" />,
      <rect key="band-b" x="0" y={base + 62} width="1000" height="5" fill={p.c} opacity="0.55" />,
      <rect key="band-c" x="0" y={base + 92} width="1000" height="2" fill={p.c} opacity="0.35" />,
    ],
  };
}

function planets(r, p) {
  const colors = [p.b, p.c, p.a, p.b];
  const discs = Array.from({ length: 4 }, (_, i) => ({
    cx: between(r, 330, 860),
    cy: between(r, 150, 720),
    radius: between(r, 44, 150),
    fill: colors[i],
  }));
  const ringed = discs[Math.floor(r() * discs.length)];
  return {
    defs: null,
    back: [<circle key="giant" cx={between(r, 120, 360)} cy={between(r, 600, 840)} r={between(r, 300, 380)} fill={p.a} />],
    mid: discs.map((disc, i) => (
      <circle key={`disc-${i}`} cx={disc.cx} cy={disc.cy} r={disc.radius} fill={disc.fill} style={{ mixBlendMode: 'multiply' }} />
    )),
    front: [
      <ellipse
        key="ring"
        cx={ringed.cx}
        cy={ringed.cy}
        rx={ringed.radius * 1.75}
        ry={ringed.radius * 0.46}
        fill="none"
        stroke={p.b}
        strokeWidth="5"
        transform={`rotate(${between(r, -32, -12)} ${ringed.cx} ${ringed.cy})`}
      />,
      ...scatter(r, 14, p.b, [80, 80, 920, 920], [3, 7]),
    ],
  };
}

function grid(r, p) {
  const count = 12;
  const gap = 1000 / (count + 1);
  const fx = between(r, 0.5, 1.3);
  const fy = between(r, 0.5, 1.3);
  const phase = between(r, 0, TAU);
  const hotRow = Math.floor(between(r, 2, count - 2));
  const dots = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      const wave = (Math.sin(col * fx + phase) + Math.cos(row * fy - phase)) / 2;
      const fill = row === hotRow ? p.b : wave > 0.72 ? p.c : p.a;
      dots.push(<circle key={`${row}-${col}`} cx={gap * (col + 1)} cy={gap * (row + 1)} r={5 + (wave + 1) * 13} fill={fill} opacity={row === hotRow ? 1 : 0.55 + (wave + 1) * 0.22} />);
    }
  }
  return {
    defs: null,
    back: [<circle key="glow" cx={between(r, 300, 700)} cy={between(r, 300, 700)} r="420" fill={p.a} opacity="0.12" />],
    mid: dots,
    front: [<line key="rule" x1={gap * 0.5} x2={1000 - gap * 0.5} y1={gap * (hotRow + 1)} y2={gap * (hotRow + 1)} stroke={p.b} strokeWidth="2" opacity="0.55" />],
  };
}

function fields(r, p) {
  const first = between(r, 300, 430);
  const second = between(r, 600, 720);
  const inset = 92;
  return {
    defs: null,
    back: [<rect key="top" x={inset} y={inset} width={1000 - inset * 2} height={first - inset - 14} rx="6" fill={p.a} opacity="0.94" />],
    mid: [<rect key="middle" x={inset} y={first + 14} width={1000 - inset * 2} height={second - first - 28} rx="6" fill={p.b} opacity="0.94" />],
    front: [
      <rect key="bottom" x={inset} y={second + 14} width={1000 - inset * 2} height={1000 - inset - second - 14} rx="6" fill={p.c} opacity="0.9" />,
      <circle key="mark" cx={between(r, 220, 780)} cy={(first + second) / 2} r={between(r, 22, 40)} fill={p.ground} />,
    ],
  };
}

function shards(r, p) {
  const ox = between(r, 320, 680);
  const oy = between(r, 640, 800);
  const fills = [p.a, p.b, p.a, p.c, p.b, p.a, p.b];
  const count = 7;
  const pieces = Array.from({ length: count }, (_, i) => {
    const from = -Math.PI * 0.93 + (i / count) * Math.PI * 0.86;
    const to = from + between(r, 0.16, 0.34);
    const length = between(r, 420, 760);
    const [x1, y1] = polar(ox, oy, length, from);
    const [x2, y2] = polar(ox, oy, length * between(r, 0.72, 0.98), to);
    return <polygon key={`shard-${i}`} points={`${ox},${oy} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`} fill={fills[i]} opacity={between(r, 0.62, 0.92)} style={{ mixBlendMode: 'screen' }} />;
  });
  return {
    defs: null,
    back: [<circle key="ember" cx={ox} cy={oy} r="330" fill={p.b} opacity="0.14" />],
    mid: pieces,
    front: [
      <circle key="origin" cx={ox} cy={oy} r="9" fill={p.c} />,
      <line key="ground" x1="60" x2="940" y1={oy + 60} y2={oy + 60} stroke={p.c} strokeWidth="2" opacity="0.4" />,
    ],
  };
}

function ripples(r, p) {
  const cx = between(r, 400, 600);
  const cy = between(r, 580, 680);
  const horizon = cy - between(r, 230, 290);
  const loops = Array.from({ length: 9 }, (_, i) => {
    const rx = 56 + i * 60;
    return <ellipse key={`ripple-${i}`} cx={cx} cy={cy} rx={rx} ry={rx * 0.3} fill="none" stroke={p.a} strokeWidth={Math.max(1.5, 9 - i)} opacity={1 - i * 0.085} />;
  });
  return {
    defs: null,
    back: [<rect key="sky" x="0" y="0" width="1000" height={horizon} fill={p.b} opacity="0.28" />],
    mid: loops,
    front: [
      <line key="horizon" x1="0" x2="1000" y1={horizon} y2={horizon} stroke={p.c} strokeWidth="2" opacity="0.6" />,
      <circle key="stone" cx={cx + between(r, -40, 40)} cy={horizon - between(r, 90, 170)} r={between(r, 20, 32)} fill={p.c} />,
    ],
  };
}

function orbits(r, p, uid) {
  const cx = between(r, 460, 540);
  const cy = between(r, 460, 540);
  const paths = Array.from({ length: 5 }, (_, i) => {
    const rx = 170 + i * 72;
    const ry = rx * between(r, 0.24, 0.52);
    const tilt = between(r, 0, Math.PI);
    const t = between(r, 0, TAU);
    const x = cx + rx * Math.cos(t) * Math.cos(tilt) - ry * Math.sin(t) * Math.sin(tilt);
    const y = cy + rx * Math.cos(t) * Math.sin(tilt) + ry * Math.sin(t) * Math.cos(tilt);
    return { rx, ry, tilt: (tilt * 180) / Math.PI, x, y, size: between(r, 8, 20) };
  });
  return {
    defs: (
      <radialGradient id={`${uid}-a`}>
        <stop offset="0" stopColor={p.a} stopOpacity="0.85" />
        <stop offset="1" stopColor={p.a} stopOpacity="0" />
      </radialGradient>
    ),
    back: [<circle key="field" cx={cx} cy={cy} r="400" fill={`url(#${uid}-a)`} />, ...scatter(r, 16, p.b, [40, 40, 960, 960], [1.5, 3.5])],
    mid: paths.map((orbit, i) => (
      <ellipse key={`orbit-${i}`} cx={cx} cy={cy} rx={orbit.rx} ry={orbit.ry} fill="none" stroke={p.b} strokeWidth="2.5" opacity={0.85 - i * 0.1} transform={`rotate(${orbit.tilt.toFixed(1)} ${cx} ${cy})`} />
    )),
    front: [
      <circle key="core" cx={cx} cy={cy} r={between(r, 38, 54)} fill={p.c} />,
      ...paths.map((orbit, i) => <circle key={`body-${i}`} cx={orbit.x} cy={orbit.y} r={orbit.size} fill={i % 2 ? p.c : p.b} />),
    ],
  };
}

function arcs(r, p) {
  const fills = [p.a, p.c, p.b, p.a];
  const group = (cx, cy, scale, flip, key) =>
    [320, 250, 180, 110].map((radius, i) => {
      const size = radius * scale;
      const d = flip ? `M ${cx - size} ${cy} A ${size} ${size} 0 0 0 ${cx + size} ${cy}` : `M ${cx - size} ${cy} A ${size} ${size} 0 0 1 ${cx + size} ${cy}`;
      return <path key={`${key}-${i}`} d={d} fill="none" stroke={fills[i]} strokeWidth={46 * scale} style={{ mixBlendMode: 'multiply' }} />;
    });
  const ax = between(r, 330, 430);
  const ay = between(r, 440, 520);
  const bx = between(r, 600, 720);
  const by = between(r, 560, 640);
  return {
    defs: null,
    back: group(ax, ay, 1, false, 'upper'),
    mid: group(bx, by, between(r, 0.62, 0.8), true, 'lower'),
    front: [
      <circle key="beat" cx={between(r, 640, 860)} cy={between(r, 140, 300)} r={between(r, 30, 52)} fill={p.b} />,
      <line key="base" x1="60" x2="940" y1={ay} y2={ay} stroke={p.b} strokeWidth="2" opacity="0.35" />,
    ],
  };
}

function contours(r, p) {
  const total = 16;
  const f1 = between(r, 0.005, 0.009);
  const f2 = between(r, 0.014, 0.022);
  const ph1 = between(r, 0, TAU);
  const ph2 = between(r, 0, TAU);
  const hot = Math.floor(between(r, 4, total - 4));
  const lines = Array.from({ length: total }, (_, i) => {
    const base = 150 + i * 47;
    const points = [];
    for (let x = -20; x <= 1020; x += 26) {
      const y = base + Math.sin(x * f1 + ph1 + i * 0.32) * 34 + Math.sin(x * f2 + ph2) * 22 * (i / total);
      points.push(`${x},${y.toFixed(1)}`);
    }
    const stroke = i === hot ? p.c : i % 3 === 0 ? p.b : p.a;
    return <polyline key={`line-${i}`} points={points.join(' ')} fill="none" stroke={stroke} strokeWidth={i === hot ? 4 : 2.5} strokeLinejoin="round" opacity={i === hot ? 1 : 0.8} />;
  });
  return {
    defs: null,
    back: [<circle key="clearing" cx={between(r, 240, 760)} cy={between(r, 260, 700)} r={between(r, 130, 200)} fill={p.a} opacity="0.24" />],
    mid: lines,
    front: [<circle key="marker" cx={between(r, 200, 800)} cy={150 + hot * 47} r="10" fill={p.c} />],
  };
}

function panes(r, p) {
  const fills = [p.a, p.b, p.c, p.b, p.a, p.c];
  const sheets = fills.map((fill, i) => {
    const width = between(r, 220, 420);
    const height = between(r, 260, 520);
    return <rect key={`pane-${i}`} x={between(r, 90, 910 - width)} y={between(r, 90, 910 - height)} width={width} height={height} fill={fill} opacity="0.62" style={{ mixBlendMode: 'multiply' }} />;
  });
  const vx = between(r, 300, 700);
  const hy = between(r, 300, 700);
  return {
    defs: null,
    back: sheets.slice(0, 3),
    mid: sheets.slice(3),
    front: [
      <line key="mullion" x1={vx} x2={vx} y1="60" y2="940" stroke={p.a} strokeWidth="2" opacity="0.7" />,
      <line key="transom" x1="60" x2="940" y1={hy} y2={hy} stroke={p.a} strokeWidth="2" opacity="0.7" />,
      <rect key="frame" x="60" y="60" width="880" height="880" fill="none" stroke={p.a} strokeWidth="2" opacity="0.5" />,
    ],
  };
}

function stripes(r, p) {
  const bars = [];
  let x = 90;
  while (x < 890) {
    const width = choose(r, [10, 16, 26, 42, 68]);
    const height = between(r, 240, 800);
    const fromTop = r() < 0.5;
    const roll = r();
    const fill = roll < 0.7 ? p.a : roll < 0.87 ? p.b : p.c;
    bars.push(<rect key={`bar-${bars.length}`} x={x} y={fromTop ? 90 : 910 - height} width={Math.min(width, 910 - x)} height={height} fill={fill} opacity={between(r, 0.72, 1)} />);
    x += width + between(r, 12, 30);
  }
  const split = Math.ceil(bars.length / 2);
  return {
    defs: null,
    back: bars.slice(0, split),
    mid: bars.slice(split),
    front: [<line key="axis" x1="60" x2="940" y1="500" y2="500" stroke={p.c} strokeWidth="2" opacity="0.45" />],
  };
}

function arch(r, p) {
  const width = between(r, 330, 430);
  const x = between(r, 240, 760 - width);
  const top = between(r, 240, 320);
  const base = 790;
  const half = width / 2;
  return {
    defs: null,
    back: [<circle key="far" cx={between(r, 640, 840)} cy={between(r, 200, 320)} r={between(r, 120, 170)} fill={p.b} opacity="0.3" />],
    mid: [
      <path key="arch" d={`M ${x} ${base} V ${top + half} A ${half} ${half} 0 0 1 ${x + width} ${top + half} V ${base} Z`} fill={p.a} />,
      <circle key="lamp" cx={x + half} cy={base - between(r, 130, 210)} r={width * 0.25} fill={p.b} />,
    ],
    front: [
      <line key="ground" x1="80" x2="920" y1={base} y2={base} stroke={p.c} strokeWidth="4" />,
      <rect key="step-a" x={x - 40} y={base + 18} width={width + 80} height="16" fill={p.c} opacity="0.85" />,
      <rect key="step-b" x={x - 90} y={base + 52} width={width + 180} height="16" fill={p.c} opacity="0.55" />,
    ],
  };
}

function blocks(r, p) {
  const accent = Math.floor(r() * 4);
  const towers = Array.from({ length: 4 }, (_, i) => {
    const height = between(r, 220, 650);
    return { x: 118 + i * 196, y: 880 - height, width: 172, height, fill: i === accent ? p.a : mixHex(p.b, p.ground, between(r, 0.15, 0.6)) };
  });
  const tallest = towers.reduce((best, tower) => (tower.height > best.height ? tower : best), towers[0]);
  const windows = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      if (r() < 0.45) continue;
      windows.push(<rect key={`window-${row}-${col}`} x={tallest.x + 26 + col * 44} y={tallest.y + 40 + row * 54} width="22" height="30" fill={p.c} opacity={between(r, 0.4, 0.95)} />);
    }
  }
  return {
    defs: null,
    back: towers.filter((_, i) => i % 2 === 0).map((tower) => <rect key={`tower-${tower.x}`} x={tower.x} y={tower.y} width={tower.width} height={tower.height} fill={tower.fill} />),
    mid: towers.filter((_, i) => i % 2 === 1).map((tower) => <rect key={`tower-${tower.x}`} x={tower.x} y={tower.y} width={tower.width} height={tower.height} fill={tower.fill} />),
    front: [...windows, <line key="street" x1="60" x2="940" y1="880" y2="880" stroke={p.b} strokeWidth="3" opacity="0.7" />],
  };
}

function rain(r, p, uid) {
  const gx = between(r, 540, 760);
  const gy = between(r, 300, 460);
  const drops = Array.from({ length: 84 }, (_, i) => {
    const x = between(r, 20, 980);
    const y = between(r, 20, 900);
    const length = between(r, 30, 112);
    return <line key={`drop-${i}`} x1={x} y1={y} x2={x - length * 0.13} y2={y + length} stroke={p.b} strokeWidth={between(r, 1.5, 4)} strokeLinecap="round" opacity={between(r, 0.2, 0.85)} />;
  });
  return {
    defs: (
      <radialGradient id={`${uid}-a`}>
        <stop offset="0" stopColor={p.c} stopOpacity="0.75" />
        <stop offset="1" stopColor={p.c} stopOpacity="0" />
      </radialGradient>
    ),
    back: [
      <circle key="lamp" cx={gx} cy={gy} r="330" fill={`url(#${uid}-a)`} />,
      <line key="sash-v" x1={gx - 170} x2={gx - 170} y1="0" y2="1000" stroke={p.a} strokeWidth="3" opacity="0.4" />,
      <line key="sash-h" x1="0" x2="1000" y1={gy + 210} y2={gy + 210} stroke={p.a} strokeWidth="3" opacity="0.4" />,
    ],
    mid: drops.slice(0, 50),
    front: drops.slice(50),
  };
}

function bloom(r, p, uid) {
  const blobs = Array.from({ length: 3 }, (_, i) => (
    <circle key={`blob-${i}`} cx={between(r, 220, 780)} cy={between(r, 220, 780)} r={between(r, 300, 430)} fill={`url(#${uid}-${i % 2 ? 'b' : 'a'})`} style={{ mixBlendMode: 'screen' }} />
  ));
  const cx = between(r, 340, 660);
  const cy = between(r, 340, 660);
  const radius = between(r, 66, 108);
  return {
    defs: (
      <>
        <radialGradient id={`${uid}-a`}>
          <stop offset="0" stopColor={p.a} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.a} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-b`}>
          <stop offset="0" stopColor={p.b} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.b} stopOpacity="0" />
        </radialGradient>
      </>
    ),
    back: blobs,
    mid: [<circle key="ember" cx={cx} cy={cy} r={radius} fill={p.c} opacity="0.95" />],
    front: [<circle key="ring" cx={cx} cy={cy} r={radius + 44} fill="none" stroke={p.c} strokeWidth="2" opacity="0.5" />, ...scatter(r, 8, p.c, [80, 80, 920, 920], [2, 4])],
  };
}

function ridges(r, p) {
  const fills = [mixHex(p.b, p.ground, 0.4), mixHex(p.b, p.a, 0.55), p.a, mixHex(p.a, p.ground, 0.45), mixHex(p.a, p.ground, 0.75)];
  const layers = fills.map((fill, i) => {
    const base = 470 + i * 92;
    const points = ['0,1000', `0,${base}`];
    for (let x = 0; x <= 1000; x += 100) {
      const peak = x % 200 === 0 ? between(r, 0, 60) : between(r, 60, 170 - i * 16);
      points.push(`${x},${(base - peak).toFixed(1)}`);
    }
    points.push(`1000,${base}`, '1000,1000');
    return <polygon key={`ridge-${i}`} points={points.join(' ')} fill={fill} />;
  });
  return {
    defs: null,
    back: [<circle key="sun" cx={between(r, 600, 800)} cy={between(r, 230, 340)} r={between(r, 56, 84)} fill={p.c} />, ...layers.slice(0, 2)],
    mid: layers.slice(2, 4),
    front: layers.slice(4),
  };
}

function moon(r, p, uid) {
  const cx = between(r, 420, 580);
  const cy = between(r, 400, 520);
  const radius = between(r, 210, 270);
  const shift = between(r, 70, 130) * (r() < 0.5 ? -1 : 1);
  const lift = between(r, -80, -20);
  return {
    defs: (
      <mask id={`${uid}-m`}>
        <rect width="1000" height="1000" fill="#000" />
        <circle cx={cx} cy={cy} r={radius} fill="#fff" />
        <circle cx={cx + shift} cy={cy + lift} r={radius * 0.94} fill="#000" />
      </mask>
    ),
    back: [<circle key="halo" cx={cx} cy={cy} r={radius * 1.7} fill={p.a} opacity="0.22" />, ...scatter(r, 16, p.b, [50, 50, 950, 950], [1.5, 4])],
    mid: [<rect key="crescent" width="1000" height="1000" fill={p.b} mask={`url(#${uid}-m)`} />],
    front: [
      <circle key="ring" cx={cx} cy={cy} r={radius * 1.28} fill="none" stroke={p.c} strokeWidth="2" opacity="0.4" />,
      <circle key="star" cx={cx - shift * 1.9} cy={cy + radius * 1.05} r="12" fill={p.c} />,
    ],
  };
}

function petals(r, p) {
  const count = 10 + Math.floor(r() * 5);
  const cx = between(r, 450, 550);
  const cy = between(r, 450, 550);
  const reach = between(r, 170, 215);
  const spin = between(r, 0, 36);
  const leaves = Array.from({ length: count }, (_, i) => (
    <ellipse key={`petal-${i}`} cx={cx} cy={cy - reach} rx={reach * 0.36} ry={reach} fill={i % 2 ? p.a : p.b} opacity="0.72" transform={`rotate(${(spin + (i * 360) / count).toFixed(1)} ${cx} ${cy})`} style={{ mixBlendMode: 'screen' }} />
  ));
  return {
    defs: null,
    back: [<circle key="halo" cx={cx} cy={cy} r={reach * 2.3} fill={p.a} opacity="0.13" />, ...leaves.filter((_, i) => i % 2 === 0)],
    mid: leaves.filter((_, i) => i % 2 === 1),
    front: [<circle key="heart" cx={cx} cy={cy} r={reach * 0.3} fill={p.c} />, <circle key="ring" cx={cx} cy={cy} r={reach * 2.05} fill="none" stroke={p.c} strokeWidth="2" opacity="0.35" />],
  };
}

function rings(r, p) {
  const cx = between(r, 440, 560);
  const cy = between(r, 440, 560);
  const circles = Array.from({ length: 8 }, (_, i) => <circle key={`ring-${i}`} cx={cx} cy={cy} r={62 + i * 50} fill="none" stroke={p.c} strokeWidth="2.5" opacity={0.85 - i * 0.08} />);
  const hotRing = 2 + Math.floor(r() * 4);
  const from = between(r, 0, TAU);
  const dotRing = 1 + Math.floor(r() * 6);
  const [dx, dy] = polar(cx, cy, 62 + dotRing * 50, between(r, 0, TAU));
  return {
    defs: null,
    back: circles.slice(4),
    mid: circles.slice(0, 4),
    front: [
      <path key="sweep" d={arcPath(cx, cy, 62 + hotRing * 50, from, from + between(r, 0.7, 1.9))} fill="none" stroke={p.b} strokeWidth="11" strokeLinecap="round" />,
      <circle key="blip" cx={dx} cy={dy} r="15" fill={p.a} />,
      <circle key="origin" cx={cx} cy={cy} r="9" fill={p.c} />,
    ],
  };
}

export const MOTIFS = { sun, halfsun, planets, grid, fields, shards, ripples, orbits, arcs, contours, panes, stripes, arch, blocks, rain, bloom, ridges, moon, petals, rings };
