import { composeTrack, createKit, playEvent } from './synth.js';

const LOOKAHEAD_SECONDS = 0.35;
const TICK_MS = 60;
const PROGRESS_MS = 250;
const MAX_NOTE_SECONDS = 10;
const FADE_SECONDS = 3;
const FORWARDED_EVENTS = ['timeupdate', 'loadedmetadata', 'durationchange', 'ended', 'waiting', 'playing', 'pause', 'error'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const veilFrequency = (amount) => 20000 * 0.018 ** amount;

function firstEventFrom(events, time) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (events[middle].time < time) low = middle + 1;
    else high = middle;
  }
  return low;
}

class SynthEngine {
  constructor(emit) {
    this.emit = emit;
    this.ctx = null;
    this.kit = null;
    this.output = null;
    this.song = null;
    this.position = 0;
    this.playing = false;
    this.startContextTime = 0;
    this.startPosition = 0;
    this.nextIndex = 0;
    this.voices = new Set();
    this.tickTimer = null;
    this.progressTimer = null;
    this.volume = 1;
    this.muted = false;
    this.loop = false;
    this.veil = null;
    this.meter = null;
    this.veilAmount = 0;
  }

  get duration() {
    return this.song ? this.song.duration : NaN;
  }

  get currentTime() {
    if (!this.song) return 0;
    if (!this.playing) return this.position;
    return Math.min(this.song.duration, this.startPosition + (this.ctx.currentTime - this.startContextTime));
  }

  set currentTime(seconds) {
    if (!this.song) return;
    const wasPlaying = this.playing;
    this.halt();
    this.position = clamp(seconds, 0, this.song.duration);
    this.emit('timeupdate');
    if (wasPlaying) this.start();
  }

  load(song) {
    this.halt();
    this.song = song;
    this.position = 0;
    if (this.kit) this.kit.setSong(song);
  }

  unload() {
    this.halt();
    this.song = null;
    this.position = 0;
  }

  setVolume(volume, muted) {
    this.volume = volume;
    this.muted = muted;
    if (this.output) this.output.gain.value = muted ? 0 : volume;
  }

  async play() {
    if (!this.song) throw new DOMException('No audio source is loaded.', 'NotSupportedError');
    this.ensureContext();
    if (this.ctx.state !== 'running') {
      await Promise.race([this.ctx.resume(), new Promise((resolve) => setTimeout(resolve, 1000))]);
      if (this.ctx.state !== 'running') throw new DOMException('Playback needs a user gesture first.', 'NotAllowedError');
    }
    if (this.position >= this.song.duration) this.position = 0;
    if (!this.playing) this.start();
  }

  pause() {
    if (!this.playing) return;
    this.halt();
    this.emit('pause');
  }

  ensureContext() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.output = this.ctx.createGain();
    this.output.gain.value = this.muted ? 0 : this.volume;
    this.output.connect(this.ctx.destination);
    this.veil = this.ctx.createBiquadFilter();
    this.veil.type = 'lowpass';
    this.veil.Q.value = 0.7;
    this.veil.frequency.value = veilFrequency(this.veilAmount);
    this.meter = this.ctx.createAnalyser();
    this.meter.fftSize = 256;
    this.meter.smoothingTimeConstant = 0.82;
    this.veil.connect(this.output);
    this.veil.connect(this.meter);
    this.kit = createKit(this.ctx, this.veil);
    if (this.song) this.kit.setSong(this.song);
  }

  setVeil(amount) {
    this.veilAmount = clamp(amount, 0, 1);
    if (!this.veil) return;
    this.veil.frequency.setTargetAtTime(veilFrequency(this.veilAmount), this.ctx.currentTime, 0.14);
  }

  async prime() {
    this.ensureContext();
    if (this.ctx.state !== 'running') {
      await Promise.race([this.ctx.resume(), new Promise((resolve) => setTimeout(resolve, 600))]);
    }
  }

  start() {
    const { ctx, song } = this;
    this.playing = true;
    this.startContextTime = ctx.currentTime + 0.05;
    this.startPosition = this.position;
    this.nextIndex = firstEventFrom(song.events, this.position - MAX_NOTE_SECONDS);
    this.scheduleFade();
    this.tick();
    this.tickTimer = setInterval(() => this.tick(), TICK_MS);
    this.progressTimer = setInterval(() => this.emit('timeupdate'), PROGRESS_MS);
    this.emit('playing');
  }

  halt() {
    if (this.playing) this.position = this.currentTime;
    this.playing = false;
    clearInterval(this.tickTimer);
    clearInterval(this.progressTimer);
    this.tickTimer = null;
    this.progressTimer = null;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const voice of this.voices) voice.stop(now);
    this.voices.clear();
    this.kit.fade.gain.cancelScheduledValues(now);
    this.kit.fade.gain.setValueAtTime(1, now);
  }

  scheduleFade() {
    const { ctx, song, kit } = this;
    const now = ctx.currentTime;
    const fadeStart = this.startContextTime + (song.duration - FADE_SECONDS - this.startPosition);
    const fadeEnd = this.startContextTime + (song.duration - this.startPosition);
    kit.fade.gain.cancelScheduledValues(now);
    if (fadeEnd <= now) {
      kit.fade.gain.setValueAtTime(0, now);
      return;
    }
    if (fadeStart <= now) {
      kit.fade.gain.setValueAtTime((fadeEnd - now) / FADE_SECONDS, now);
    } else {
      kit.fade.gain.setValueAtTime(1, now);
      kit.fade.gain.setValueAtTime(1, fadeStart);
    }
    kit.fade.gain.linearRampToValueAtTime(0, fadeEnd);
  }

  tick() {
    if (!this.playing) return;
    const { ctx, song } = this;
    const position = this.currentTime;
    if (position >= song.duration) {
      this.finish();
      return;
    }
    const horizon = position + LOOKAHEAD_SECONDS;
    const { events } = song;
    while (this.nextIndex < events.length && events[this.nextIndex].time < horizon) {
      const event = events[this.nextIndex];
      this.nextIndex += 1;
      if (event.time + (event.duration ?? 0.3) <= position) continue;
      let when = this.startContextTime + (event.time - this.startPosition);
      let cut = 0;
      const earliest = ctx.currentTime + 0.005;
      if (when < earliest) {
        cut = earliest - when;
        when = earliest;
      }
      if (cut > 0 && event.type !== 'tone') continue;
      const voice = playEvent(this.kit, event, when, cut);
      if (!voice) continue;
      this.voices.add(voice);
      voice.source.onended = () => this.voices.delete(voice);
    }
  }

  finish() {
    this.halt();
    if (this.loop) {
      this.position = 0;
      this.start();
      return;
    }
    this.position = this.song.duration;
    this.emit('timeupdate');
    this.emit('ended');
  }
}

class HybridPlayer extends EventTarget {
  constructor() {
    super();
    this.mode = null;
    this.track = null;
    this.element = new Audio();
    this.element.preload = 'metadata';
    this.engine = new SynthEngine((name) => this.dispatchEvent(new Event(name)));
    this.settings = { volume: 1, muted: false, loop: false };
    for (const name of FORWARDED_EVENTS) {
      this.element.addEventListener(name, () => {
        if (this.mode === 'element') this.dispatchEvent(new Event(name));
      });
    }
  }

  load(track, { synth = false } = {}) {
    this.track = track;
    if (track.audioUrl && !synth) {
      this.engine.unload();
      this.mode = 'element';
      this.element.src = track.audioUrl;
      this.element.load();
      return;
    }
    this.mode = 'synth';
    this.element.pause();
    this.element.removeAttribute('src');
    this.element.load();
    this.engine.load(composeTrack(track));
    queueMicrotask(() => {
      if (this.mode !== 'synth' || this.track !== track) return;
      this.dispatchEvent(new Event('loadedmetadata'));
      this.dispatchEvent(new Event('durationchange'));
    });
  }

  unload() {
    this.track = null;
    this.mode = null;
    this.engine.unload();
    this.element.pause();
    this.element.removeAttribute('src');
    this.element.load();
  }

  play() {
    if (this.mode === 'element') return this.element.play();
    if (this.mode === 'synth') return this.engine.play();
    return Promise.reject(new DOMException('No audio source is loaded.', 'NotSupportedError'));
  }

  pause() {
    this.element.pause();
    this.engine.pause();
  }

  get currentTime() {
    return this.mode === 'element' ? this.element.currentTime : this.engine.currentTime;
  }

  set currentTime(seconds) {
    if (this.mode === 'element') this.element.currentTime = seconds;
    else this.engine.currentTime = seconds;
  }

  get duration() {
    return this.mode === 'element' ? this.element.duration : this.engine.duration;
  }

  get paused() {
    return this.mode === 'element' ? this.element.paused : !this.engine.playing;
  }

  get analyser() {
    return this.mode === 'synth' ? this.engine.meter : null;
  }

  get composition() {
    return this.mode === 'synth' ? this.engine.song : null;
  }

  setVeil(amount) {
    this.engine.setVeil(amount);
  }

  prime() {
    return this.engine.prime().catch(() => {});
  }

  get error() {
    return this.mode === 'element' ? this.element.error : null;
  }

  get volume() {
    return this.settings.volume;
  }

  set volume(value) {
    this.settings.volume = value;
    this.element.volume = value;
    this.engine.setVolume(value, this.settings.muted);
  }

  get muted() {
    return this.settings.muted;
  }

  set muted(value) {
    this.settings.muted = value;
    this.element.muted = value;
    this.engine.setVolume(this.settings.volume, value);
  }

  get loop() {
    return this.settings.loop;
  }

  set loop(value) {
    this.settings.loop = value;
    this.element.loop = value;
    this.engine.loop = value;
  }
}

export function createPlayer() {
  return new HybridPlayer();
}
