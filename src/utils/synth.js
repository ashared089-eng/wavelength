const CACHE_LIMIT = 24;
const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const PROGRESSIONS = {
  major: [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [3, 0, 4, 5], [0, 3, 5, 4], [1, 4, 0, 5]],
  minor: [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [0, 5, 3, 4], [5, 6, 0, 0], [0, 2, 5, 6]],
};

const DRUMS = {
  electronic: { kick: [[0, 4, 8, 12], [0, 4, 8, 10, 12]], snare: [4, 12], hats: 8, openHats: [14], gain: 1 },
  fourfloor: { kick: [[0, 4, 8, 12]], snare: [4, 12], hats: 16, openHats: [2, 6, 10, 14], gain: 1 },
  pop: { kick: [[0, 8], [0, 6, 8], [0, 5, 8, 10]], snare: [4, 12], hats: 8, openHats: [], gain: 0.9 },
  rock: { kick: [[0, 8, 10], [0, 6, 8], [0, 3, 8, 11]], snare: [4, 12], hats: 8, openHats: [], gain: 1 },
  lofi: { kick: [[0, 7, 10], [0, 6, 10], [0, 10]], snare: [4, 12], hats: 8, openHats: [], gain: 0.7, swing: 0.62 },
  trap: { kick: [[0, 6, 10], [0, 7, 10, 13], [0, 6]], snare: [8], hats: 16, openHats: [], gain: 1 },
  latin: { kick: [[0, 4, 8, 12]], snare: [3, 6, 11, 14], hats: 8, openHats: [], gain: 0.9 },
  brush: { kick: [[0, 8]], snare: [4, 12], hats: 8, openHats: [], gain: 0.45 },
  soft: { kick: [[0, 8], [0, 10]], snare: [4, 12], hats: 8, openHats: [], gain: 0.55 },
};

const BASS_PATTERNS = {
  eighths: [[0, 0, 2], [2, 0, 2], [4, 0, 2], [6, 7, 2], [8, 0, 2], [10, 0, 2], [12, 0, 2], [14, 12, 2]],
  offbeat: [[2, 0, 1.5], [6, 0, 1.5], [10, 7, 1.5], [14, 0, 1.5]],
  walking: [[0, 0, 4], [4, 7, 4], [8, 0, 4], [12, 7, 4]],
  lazy: [[0, 0, 7], [8, 0, 5], [14, 7, 2]],
  sub: [[0, 0, 6], [6, 0, 3], [10, 0, 6]],
  dembow: [[0, 0, 3], [3, 0, 1], [4, 7, 4], [8, 0, 3], [11, 0, 1], [12, 7, 4]],
  whole: [[0, 0, 16]],
};

const STYLES = [
  { keys: ['synthwave'], bpm: [96, 110], mode: 'minor', drums: 'electronic', bass: { wave: 'sawtooth', pattern: 'eighths' }, pad: 'sawtooth', arp: { wave: 'square', rate: 16 }, lead: 'square', delay: 0.3 },
  { keys: ['house', 'dance'], bpm: [122, 128], mode: 'minor', drums: 'fourfloor', bass: { wave: 'sawtooth', pattern: 'offbeat' }, pad: 'sawtooth', arp: { wave: 'square', rate: 16 }, lead: 'sawtooth', delay: 0.25 },
  { keys: ['electro', 'electronic'], bpm: [112, 124], mode: 'minor', drums: 'electronic', bass: { wave: 'square', pattern: 'eighths' }, pad: 'sawtooth', arp: { wave: 'triangle', rate: 16 }, lead: 'square', delay: 0.3 },
  { keys: ['lo-fi', 'jazz', 'chill'], bpm: [68, 84], mode: 'dorian', drums: 'lofi', bass: { wave: 'triangle', pattern: 'lazy' }, pad: 'triangle', arp: null, lead: 'sine', sevenths: true, delay: 0.2 },
  { keys: ['hip-hop', 'rap'], bpm: [82, 94], mode: 'minor', drums: 'trap', bass: { wave: 'sine', pattern: 'sub' }, pad: 'triangle', arp: null, lead: 'triangle', sevenths: true, delay: 0.2 },
  { keys: ['rock'], bpm: [118, 146], mode: 'mixolydian', drums: 'rock', bass: { wave: 'sawtooth', pattern: 'eighths' }, pad: 'power', arp: null, lead: 'sawtooth', delay: 0.15 },
  { keys: ['folk', 'americana', 'acoustic', 'singer-songwriter'], bpm: [84, 104], mode: 'major', drums: 'brush', bass: { wave: 'triangle', pattern: 'walking' }, pad: null, arp: { wave: 'triangle', rate: 8 }, lead: 'triangle', delay: 0.15 },
  { keys: ['dream pop', 'shoegaze'], bpm: [88, 108], mode: 'major', drums: 'soft', bass: { wave: 'triangle', pattern: 'lazy' }, pad: 'sawtooth', arp: null, lead: 'triangle', delay: 0.45 },
  { keys: ['latin', 'r&b', 'afrobeats'], bpm: [94, 106], mode: 'minor', drums: 'latin', bass: { wave: 'square', pattern: 'dembow' }, pad: 'sawtooth', arp: { wave: 'triangle', rate: 8 }, lead: 'triangle', sevenths: true, delay: 0.2 },
  { keys: ['ambient', 'cinematic', 'focus'], bpm: [58, 70], mode: 'major', drums: null, bass: { wave: 'sine', pattern: 'whole' }, pad: 'sawtooth', arp: null, lead: 'sine', delay: 0.5, sparse: true },
  { keys: ['classical', 'piano'], bpm: [66, 84], mode: 'minor', drums: null, bass: { wave: 'triangle', pattern: 'walking' }, pad: null, arp: { wave: 'triangle', rate: 8 }, lead: 'triangle', delay: 0.3, piano: true },
  { keys: ['pop', 'indie'], bpm: [100, 118], mode: 'major', drums: 'pop', bass: { wave: 'square', pattern: 'eighths' }, pad: 'sawtooth', arp: { wave: 'triangle', rate: 8 }, lead: 'triangle', delay: 0.25 },
];
const DEFAULT_STYLE = STYLES[STYLES.length - 1];

const LEVELS = {
  intro: { drums: 0, bass: 0, pad: 0.7, arp: 0.6, lead: 0 },
  verse: { drums: 0.85, bass: 1, pad: 0.7, arp: 0, lead: 0.9 },
  chorus: { drums: 1, bass: 1, pad: 1, arp: 1, lead: 1 },
  bridge: { drums: 0.4, bass: 0.8, pad: 0.9, arp: 0, lead: 0.85 },
  outro: { drums: 0, bass: 0.5, pad: 0.7, arp: 0.6, lead: 0 },
};
const SECTION_BARS = { intro: 4, verse: 8, chorus: 8, bridge: 4, outro: 4 };
const SECTION_CYCLE = ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'];

const compositions = new Map();

export function composeTrack(track) {
  const cached = compositions.get(track.id);
  if (cached) return cached;
  const song = composeSong(track);
  const events = [];
  scheduleSong(song, track.duration, (event) => events.push(event));
  events.sort((a, b) => a.time - b.time);
  const composition = {
    id: track.id,
    bpm: song.bpm,
    delay: song.style.delay,
    duration: track.duration,
    events,
    tonic: NOTE_NAMES[song.root],
    mode: song.style.mode,
    styleName: song.style.keys[0],
  };
  compositions.set(track.id, composition);
  if (compositions.size > CACHE_LIMIT) compositions.delete(compositions.keys().next().value);
  return composition;
}

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (random, items) => items[Math.floor(random() * items.length)];
const lerp = (from, to, t) => from + (to - from) * t;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mtof = (midi) => 440 * 2 ** ((midi - 69) / 12);

function pickStyle(genres = []) {
  const names = genres.map((genre) => genre.toLowerCase());
  return STYLES.find((style) => style.keys.some((key) => names.some((name) => name.includes(key)))) ?? DEFAULT_STYLE;
}

function composeSong(track) {
  const random = createRandom(hashString(track.id));
  const style = pickStyle(track.genres);
  const bpm = Math.round(lerp(style.bpm[0], style.bpm[1], random()));
  const family = style.mode === 'major' || style.mode === 'mixolydian' ? 'major' : 'minor';
  const progression = pick(random, PROGRESSIONS[family]);
  const bridgeProgression = pick(random, PROGRESSIONS[family].filter((candidate) => candidate !== progression));
  return {
    style,
    bpm,
    scale: SCALES[style.mode],
    root: Math.floor(random() * 12),
    progression,
    bridgeProgression,
    motifs: { verse: createMotif(random, style, 0.45), chorus: createMotif(random, style, 0.6) },
    sections: buildSections(bpm, track.duration),
  };
}

function buildSections(bpm, duration) {
  const barSeconds = 240 / bpm;
  const totalBars = Math.ceil(duration / barSeconds);
  const sections = [{ kind: 'intro', bars: SECTION_BARS.intro }];
  let bars = SECTION_BARS.intro;
  let index = 0;
  while (bars < totalBars - SECTION_BARS.outro) {
    const kind = SECTION_CYCLE[index % SECTION_CYCLE.length];
    sections.push({ kind, bars: SECTION_BARS[kind] });
    bars += SECTION_BARS[kind];
    index += 1;
  }
  sections.push({ kind: 'outro', bars: SECTION_BARS.outro });
  return sections;
}

function createMotif(random, style, density) {
  const slots = new Array(16).fill(null);
  let degree = 3 + Math.floor(random() * 3);
  let index = 0;
  while (index < 16) {
    if (index === 0 || random() < (style.sparse ? 0.25 : density)) {
      const roll = random();
      const length = style.sparse ? 4 + Math.floor(random() * 4) : roll < 0.6 ? 1 : roll < 0.9 ? 2 : 4;
      const jump = random();
      const direction = random() < 0.5 ? -1 : 1;
      const move = jump < 0.55 ? direction : jump < 0.85 ? direction * 2 : direction * 3;
      degree = clamp(degree + move, 0, 9);
      slots[index] = { degree, length: Math.min(length, 16 - index) };
      index += slots[index].length;
    } else {
      index += 1;
    }
  }
  return slots;
}

function chordFor(song, degree) {
  const size = song.style.sevenths ? 4 : 3;
  const degrees = Array.from({ length: size }, (_, i) => degree + i * 2);
  const semis = degrees.map((d) => song.scale[d % 7] + 12 * Math.floor(d / 7));
  return { semis, rootSemi: semis[0], set: new Set(degrees.map((d) => d % 7)) };
}

function scheduleSong(song, duration, emit) {
  const { style } = song;
  const step = 60 / song.bpm / 4;
  const barLength = step * 16;
  const drums = style.drums ? DRUMS[style.drums] : null;
  const swing = drums?.swing ?? 0.5;
  let time = 0;
  let barIndex = 0;
  for (const section of song.sections) {
    const progression = section.kind === 'bridge' ? song.bridgeProgression : song.progression;
    const level = LEVELS[section.kind];
    const arpLevel = level.arp || (style.pad ? 0 : level.pad);
    for (let bar = 0; bar < section.bars; bar += 1) {
      if (time >= duration) return;
      const chord = chordFor(song, progression[bar % progression.length]);
      const at = (s) => time + s * step + (s % 4 === 2 ? (swing - 0.5) * 2 * step : 0);
      if (drums && level.drums > 0) scheduleDrums(emit, drums, at, barIndex, level.drums, section.kind, bar === section.bars - 1);
      if (level.bass > 0) scheduleBass(emit, song, chord, at, step, level.bass);
      if (style.pad === 'power' && level.pad > 0) schedulePower(emit, song, chord, at, step, level.pad);
      else if (style.pad && level.pad > 0) schedulePad(emit, song, chord, time, barLength, level.pad);
      if (style.arp && arpLevel > 0) scheduleArp(emit, song, chord, at, step, arpLevel);
      if (level.lead > 0) scheduleLead(emit, song, section, chord, at, step, level.lead, bar);
      time += barLength;
      barIndex += 1;
    }
  }
}

function scheduleDrums(emit, drums, at, barIndex, level, kind, lastBar) {
  const gain = drums.gain * level;
  const kicks = drums.kick[Math.floor(barIndex / 2) % drums.kick.length];
  for (const s of kicks) emit({ type: 'kick', time: at(s), gain: 0.9 * gain });
  if (level >= 0.5) for (const s of drums.snare) emit({ type: 'snare', time: at(s), gain: 0.6 * gain });
  const hatStep = 16 / drums.hats;
  for (let s = 0; s < 16; s += hatStep) {
    const open = drums.openHats.includes(s);
    emit({ type: 'hat', time: at(s), gain: (open ? 0.22 : s % 4 === 0 ? 0.18 : 0.11) * gain, open });
  }
  if (lastBar && kind !== 'intro' && level >= 0.5) for (const s of [13, 14, 15]) emit({ type: 'snare', time: at(s), gain: 0.35 * gain });
}

function note(emit, bus, params) {
  emit({
    type: 'tone',
    bus,
    attack: 0.01,
    release: 0.08,
    cutoff: 4000,
    detune: 0,
    pan: null,
    vibrato: 0,
    decay: 0,
    sustain: 1,
    ...params,
  });
}

function scheduleBass(emit, song, chord, at, step, level) {
  const { wave, pattern } = song.style.bass;
  let root = 36 + song.root + (chord.rootSemi % 12);
  if (root > 45) root -= 12;
  const gain = (wave === 'sine' ? 0.4 : wave === 'triangle' ? 0.34 : 0.22) * level;
  for (const [s, offset, length] of BASS_PATTERNS[pattern]) {
    note(emit, 'bass', {
      wave,
      freq: mtof(root + offset),
      time: at(s),
      duration: length * step * 0.9,
      gain,
      release: 0.06,
      cutoff: wave === 'sine' ? 300 : 520,
      decay: 0.25,
      sustain: 0.7,
    });
  }
}

function schedulePad(emit, song, chord, time, barLength, level) {
  const { style } = song;
  const detunes = style.pad === 'triangle' ? [0] : [-7, 7];
  const gain = (0.11 / detunes.length) * level;
  chord.semis.forEach((semi, index) => {
    const midi = 60 + song.root + (semi % 12);
    for (const detune of detunes) {
      note(emit, 'pad', {
        wave: style.pad,
        freq: mtof(midi),
        time,
        duration: barLength * 0.98,
        gain,
        attack: style.sparse ? 1.2 : 0.35,
        release: 0.6,
        cutoff: style.sparse ? 700 : 1100,
        detune,
        pan: (index % 2 === 0 ? -0.35 : 0.35) * (detune < 0 ? -1 : 1),
      });
    }
  });
}

function schedulePower(emit, song, chord, at, step, level) {
  const root = 48 + song.root + (chord.rootSemi % 12);
  for (let s = 0; s < 16; s += 2) {
    const duration = step * (s % 8 === 6 ? 1.3 : 1.85);
    for (const offset of [0, 7, 12]) {
      note(emit, 'drive', {
        wave: 'sawtooth',
        freq: mtof(root + offset),
        time: at(s),
        duration,
        gain: 0.09 * level,
        attack: 0.004,
        release: 0.03,
        cutoff: 1600,
        detune: offset === 12 ? -5 : 4,
      });
    }
  }
}

function scheduleArp(emit, song, chord, at, step, level) {
  const { style } = song;
  const notes = chord.semis.map((semi) => 60 + song.root + (semi % 12)).sort((a, b) => a - b);
  const sequence = style.piano ? [0, 2, 1, 2] : [0, 1, 2, 3];
  const stride = 16 / style.arp.rate;
  let i = 0;
  for (let s = 0; s < 16; s += stride, i += 1) {
    const slot = sequence[i % sequence.length];
    const midi = slot < notes.length ? notes[slot] : notes[slot % notes.length] + 12;
    note(emit, i % 2 === 0 ? 'arpLeft' : 'arpRight', {
      wave: style.arp.wave,
      freq: mtof(midi),
      time: at(s),
      duration: stride * step * 0.8,
      gain: (style.piano ? 0.16 : 0.1) * level,
      attack: 0.004,
      release: style.piano ? 0.5 : 0.08,
      cutoff: 3200,
      decay: style.piano ? 0.6 : 0.18,
      sustain: style.piano ? 0.3 : 0.4,
    });
  }
}

function scheduleLead(emit, song, section, chord, at, step, level, bar) {
  const { style } = song;
  const motif = song.motifs[section.kind === 'chorus' ? 'chorus' : 'verse'];
  const offset = (bar % 2) * 8;
  const shift = (bar % 8 >= 6 ? 2 : 0) + (section.kind === 'bridge' ? 2 : 0);
  const wave = style.piano ? 'triangle' : style.lead;
  for (let slot = 0; slot < 8; slot += 1) {
    const entry = motif[offset + slot];
    if (!entry) continue;
    let degree = clamp(entry.degree + shift, 0, 9);
    if (slot % 4 === 0 && !chord.set.has(degree % 7)) degree += chord.set.has((degree + 1) % 7) ? 1 : -1;
    degree = clamp(degree, 0, 9);
    const midi = 60 + song.root + song.scale[degree % 7] + 12 * Math.floor(degree / 7);
    note(emit, 'lead', {
      wave,
      freq: mtof(midi),
      time: at(slot * 2),
      duration: entry.length * 2 * step * (style.sparse ? 0.98 : 0.85),
      gain: (wave === 'sine' ? 0.2 : wave === 'triangle' ? 0.16 : 0.09) * level,
      attack: style.sparse ? 0.4 : 0.02,
      release: style.piano ? 0.5 : 0.12,
      cutoff: wave === 'sawtooth' ? 1800 : 2600,
      vibrato: style.piano ? 0 : 6,
      decay: style.piano ? 0.7 : 0,
      sustain: style.piano ? 0.3 : 1,
    });
  }
}

export function createKit(ctx, destination) {
  const fade = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.25;
  fade.connect(compressor).connect(destination);

  const send = ctx.createGain();
  const delay = ctx.createDelay(2);
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2400;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.5;
  send.connect(delay).connect(damp);
  damp.connect(feedback).connect(delay);
  damp.connect(wet).connect(fade);

  const taps = {};
  const make = (name, pan = 0, sendable = false) => {
    const input = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    input.connect(panner).connect(fade);
    if (sendable) {
      const tap = ctx.createGain();
      tap.gain.value = 0;
      panner.connect(tap).connect(send);
      taps[name] = tap;
    }
    return input;
  };
  const drive = ctx.createWaveShaper();
  drive.curve = createDriveCurve(12);
  drive.oversample = '2x';
  const driveFilter = ctx.createBiquadFilter();
  driveFilter.type = 'lowpass';
  driveFilter.frequency.value = 3200;
  const driveOut = ctx.createGain();
  driveOut.gain.value = 0.5;
  drive.connect(driveFilter).connect(driveOut).connect(fade);

  const buses = {
    drums: make('drums'),
    bass: make('bass'),
    pad: make('pad', 0, true),
    arpLeft: make('arpLeft', -0.3, true),
    arpRight: make('arpRight', 0.3, true),
    lead: make('lead', 0.05, true),
    drive,
  };

  return {
    ctx,
    fade,
    buses,
    noise: createNoiseBuffer(ctx),
    setSong(song) {
      delay.delayTime.value = (60 / song.bpm) * 0.75;
      taps.pad.gain.value = song.delay * 0.6;
      taps.arpLeft.gain.value = song.delay;
      taps.arpRight.gain.value = song.delay;
      taps.lead.gain.value = song.delay;
    },
  };
}

function createDriveCurve(amount) {
  const size = 1024;
  const curve = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    const x = (i * 2) / size - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function createNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const random = createRandom(1234);
  for (let i = 0; i < data.length; i += 1) data[i] = random() * 2 - 1;
  return buffer;
}

export function playEvent(kit, event, when, cut = 0) {
  if (event.gain <= 0) return null;
  if (event.type === 'tone') return tone(kit, event, when, cut);
  if (event.type === 'kick') return kick(kit, event, when);
  if (event.type === 'snare') return snare(kit, event, when);
  if (event.type === 'hat') return hat(kit, event, when);
  return null;
}

function voice(sources, amps, endsAt) {
  return {
    source: sources[0],
    endsAt,
    stop(at) {
      for (const amp of amps) {
        amp.gain.cancelScheduledValues(at);
        amp.gain.setTargetAtTime(0, at, 0.01);
      }
      for (const source of sources) {
        try {
          source.stop(at + 0.06);
        } catch {}
      }
    },
  };
}

function tone(kit, event, when, cut) {
  const { ctx } = kit;
  const duration = event.duration - cut;
  if (duration <= 0) return null;
  const attack = cut > 0 ? 0.01 : event.attack;
  const osc = ctx.createOscillator();
  osc.type = event.wave;
  osc.frequency.value = event.freq;
  osc.detune.value = event.detune;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = event.cutoff;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, when);
  amp.gain.linearRampToValueAtTime(event.gain, when + attack);
  if (event.decay > 0) amp.gain.setTargetAtTime(event.gain * event.sustain, when + attack, event.decay);
  const end = when + duration;
  amp.gain.setTargetAtTime(0, end, event.release / 3);
  osc.connect(filter).connect(amp);
  const bus = kit.buses[event.bus];
  if (event.pan === null) {
    amp.connect(bus);
  } else {
    const panner = ctx.createStereoPanner();
    panner.pan.value = event.pan;
    amp.connect(panner).connect(bus);
  }
  const stopAt = end + event.release * 2 + 0.05;
  const sources = [osc];
  if (event.vibrato > 0) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const depth = ctx.createGain();
    depth.gain.value = event.vibrato;
    lfo.connect(depth).connect(osc.detune);
    lfo.start(when);
    lfo.stop(stopAt);
    sources.push(lfo);
  }
  osc.start(when);
  osc.stop(stopAt);
  return voice(sources, [amp], stopAt);
}

function kick(kit, event, when) {
  const { ctx } = kit;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(48, when + 0.12);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(event.gain, when);
  amp.gain.exponentialRampToValueAtTime(0.001, when + 0.4);
  osc.connect(amp).connect(kit.buses.drums);
  osc.start(when);
  osc.stop(when + 0.42);
  return voice([osc], [amp], when + 0.42);
}

function snare(kit, event, when) {
  const { ctx } = kit;
  const source = ctx.createBufferSource();
  source.buffer = kit.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(event.gain, when);
  amp.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
  source.connect(filter).connect(amp).connect(kit.buses.drums);
  source.start(when);
  source.stop(when + 0.22);
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(220, when);
  body.frequency.exponentialRampToValueAtTime(120, when + 0.08);
  const bodyAmp = ctx.createGain();
  bodyAmp.gain.setValueAtTime(event.gain * 0.6, when);
  bodyAmp.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  body.connect(bodyAmp).connect(kit.buses.drums);
  body.start(when);
  body.stop(when + 0.14);
  return voice([source, body], [amp, bodyAmp], when + 0.22);
}

function hat(kit, event, when) {
  const { ctx } = kit;
  const source = ctx.createBufferSource();
  source.buffer = kit.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  const length = event.open ? 0.28 : 0.06;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(event.gain, when);
  amp.gain.exponentialRampToValueAtTime(0.001, when + length);
  source.connect(filter).connect(amp).connect(kit.buses.drums);
  source.start(when);
  source.stop(when + length + 0.02);
  return voice([source], [amp], when + length + 0.02);
}
