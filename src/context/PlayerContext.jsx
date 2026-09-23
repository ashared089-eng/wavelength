import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getRecord, getRecordTracks, getTrack, recordContext } from '../data/catalog.js';
import { clamp, shuffleArray } from '../utils/array.js';
import { isSameContext } from '../utils/playback.js';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage.js';
import { createPlayer } from '../utils/synthPlayer.js';
import { useToast } from './ToastContext.jsx';

const PlayerContext = createContext(null);
const ProgressContext = createContext({ currentTime: 0, duration: 0 });
const EngineContext = createContext(null);

export const REPEAT_MODES = ['off', 'all', 'one'];
const RESTART_THRESHOLD_SECONDS = 3;
const MAX_CONSECUTIVE_FAILURES = 3;

let queueCounter = 0;
const toQueueItem = (track) => {
  queueCounter += 1;
  return { ...track, queueId: `q${queueCounter}` };
};

const initialState = {
  queue: [],
  unshuffledQueue: null,
  currentIndex: -1,
  context: null,
  isPlaying: false,
  isBuffering: false,
  shuffle: false,
  repeat: 'off',
  volume: 0.8,
  isMuted: false,
};

function shuffleAround(items, current) {
  return [current, ...shuffleArray(items.filter((item) => item !== current))];
}

function reducer(state, action) {
  switch (action.type) {
    case 'PLAY_TRACKS': {
      const { tracks, startIndex, context } = action;
      if (!tracks.length) return state;
      const items = tracks.map(toQueueItem);
      const start = items[clamp(startIndex, 0, items.length - 1)];
      const queue = state.shuffle ? shuffleAround(items, start) : items;
      return {
        ...state,
        queue,
        unshuffledQueue: state.shuffle ? items : null,
        currentIndex: queue.indexOf(start),
        context,
        isPlaying: true,
        isBuffering: false,
      };
    }
    case 'PLAY':
      return state.currentIndex < 0 ? state : { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'TOGGLE_PLAY':
      return state.currentIndex < 0 ? state : { ...state, isPlaying: !state.isPlaying };
    case 'JUMP_TO':
      if (action.index < 0 || action.index >= state.queue.length) return state;
      return { ...state, currentIndex: action.index, isPlaying: true };
    case 'NEXT': {
      const lastIndex = state.queue.length - 1;
      if (lastIndex < 0) return state;
      if (state.currentIndex < lastIndex) {
        return { ...state, currentIndex: state.currentIndex + 1, isPlaying: true };
      }
      const keepPlaying = state.repeat === 'all' || !action.natural;
      return { ...state, currentIndex: 0, isPlaying: keepPlaying };
    }
    case 'PREVIOUS': {
      if (state.queue.length === 0) return state;
      if (state.currentIndex > 0) return { ...state, currentIndex: state.currentIndex - 1, isPlaying: true };
      if (state.repeat === 'all') return { ...state, currentIndex: state.queue.length - 1, isPlaying: true };
      return state;
    }
    case 'TOGGLE_SHUFFLE': {
      const shuffle = !state.shuffle;
      const current = state.queue[state.currentIndex];
      if (!current) return { ...state, shuffle };
      if (shuffle) {
        return { ...state, shuffle, unshuffledQueue: state.queue, queue: shuffleAround(state.queue, current), currentIndex: 0 };
      }
      const live = new Set(state.queue.map((item) => item.queueId));
      const restored = (state.unshuffledQueue ?? state.queue).filter((item) => live.has(item.queueId));
      const known = new Set(restored.map((item) => item.queueId));
      const queue = [...restored, ...state.queue.filter((item) => !known.has(item.queueId))];
      return { ...state, shuffle, unshuffledQueue: null, queue, currentIndex: queue.indexOf(current) };
    }
    case 'CYCLE_REPEAT': {
      const nextMode = REPEAT_MODES[(REPEAT_MODES.indexOf(state.repeat) + 1) % REPEAT_MODES.length];
      return { ...state, repeat: nextMode };
    }
    case 'SET_VOLUME':
      return { ...state, volume: clamp(action.volume, 0, 1), isMuted: false };
    case 'TOGGLE_MUTE':
      if (state.isMuted) return { ...state, isMuted: false, volume: state.volume === 0 ? 0.5 : state.volume };
      return { ...state, isMuted: true };
    case 'SET_BUFFERING':
      return state.isBuffering === action.value ? state : { ...state, isBuffering: action.value };
    default:
      return state;
  }
}

function loadPersistedState() {
  const saved = loadJSON(STORAGE_KEYS.player, null);
  if (!saved) return initialState;
  const queue = (saved.queueIds ?? []).map(getTrack).filter(Boolean).map(toQueueItem);
  return {
    ...initialState,
    queue,
    currentIndex: queue.length ? clamp(saved.currentIndex ?? 0, 0, queue.length - 1) : -1,
    context: saved.context ?? null,
    shuffle: Boolean(saved.shuffle),
    repeat: REPEAT_MODES.includes(saved.repeat) ? saved.repeat : 'off',
    volume: typeof saved.volume === 'number' ? clamp(saved.volume, 0, 1) : initialState.volume,
    isMuted: Boolean(saved.isMuted),
  };
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersistedState);
  const [audio] = useState(createPlayer);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const toast = useToast();

  const stateRef = useRef(state);
  stateRef.current = state;
  const consecutiveFailures = useRef(0);

  const currentTrack = state.queue[state.currentIndex] ?? null;

  useEffect(() => {
    saveJSON(STORAGE_KEYS.player, {
      queueIds: state.queue.map((item) => item.id),
      currentIndex: state.currentIndex,
      context: state.context,
      shuffle: state.shuffle,
      repeat: state.repeat,
      volume: state.volume,
      isMuted: state.isMuted,
    });
  }, [state.queue, state.currentIndex, state.context, state.shuffle, state.repeat, state.volume, state.isMuted]);

  useEffect(() => {
    if (!currentTrack) {
      audio.unload();
      setProgress({ currentTime: 0, duration: 0 });
      return;
    }
    audio.load(currentTrack);
    setProgress({ currentTime: 0, duration: currentTrack.duration });
  }, [audio, currentTrack]);

  useEffect(() => {
    if (!currentTrack) return;
    if (!state.isPlaying) {
      audio.pause();
      return;
    }
    const playAttempt = audio.play();
    if (!playAttempt) return;
    playAttempt.catch((error) => {
      if (error.name === 'AbortError' || error.name === 'NotSupportedError') return;
      dispatch({ type: 'PAUSE' });
      if (error.name === 'NotAllowedError') toast('Hit play to start the sound.');
    });
  }, [audio, state.isPlaying, currentTrack, toast]);

  useEffect(() => {
    audio.volume = state.volume;
    audio.muted = state.isMuted;
  }, [audio, state.volume, state.isMuted]);

  useEffect(() => {
    audio.loop = state.repeat === 'one';
  }, [audio, state.repeat]);

  useEffect(() => {
    const handleTimeUpdate = () => setProgress((previous) => ({ ...previous, currentTime: audio.currentTime }));
    const handleDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setProgress((previous) => ({ ...previous, duration: audio.duration }));
      }
    };
    const handleEnded = () => dispatch({ type: 'NEXT', natural: true });
    const handleWaiting = () => dispatch({ type: 'SET_BUFFERING', value: true });
    const handlePlaying = () => {
      consecutiveFailures.current = 0;
      dispatch({ type: 'SET_BUFFERING', value: false });
    };
    const handleError = () => {
      if (audio.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
      const { queue, currentIndex, isPlaying } = stateRef.current;
      const track = queue[currentIndex];
      if (!track) return;
      if (audio.mode === 'element') {
        audio.load(track, { synth: true });
        if (isPlaying) audio.play().catch(() => {});
        return;
      }
      dispatch({ type: 'SET_BUFFERING', value: false });
      consecutiveFailures.current += 1;
      if (consecutiveFailures.current === 1) toast(`couldn’t play “${track.title}”`, { tone: 'error' });
      if (consecutiveFailures.current >= Math.min(MAX_CONSECUTIVE_FAILURES, queue.length)) {
        dispatch({ type: 'PAUSE' });
        return;
      }
      dispatch({ type: 'NEXT', natural: true });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDuration);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDuration);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, [audio, toast]);

  const playTracks = useCallback((tracks, { startIndex = 0, context = null } = {}) => {
    dispatch({ type: 'PLAY_TRACKS', tracks, startIndex, context });
  }, []);

  const playTrack = useCallback(
    (track) => {
      const { queue, currentIndex } = stateRef.current;
      if (queue[currentIndex]?.id === track.id) {
        dispatch({ type: 'PLAY' });
        return;
      }
      const record = getRecord(track.recordId);
      playTracks(getRecordTracks(track.recordId), { startIndex: track.number - 1, context: record ? recordContext(record) : null });
    },
    [playTracks],
  );

  const play = useCallback(() => dispatch({ type: 'PLAY' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT', natural: false }), []);
  const jumpTo = useCallback((index) => dispatch({ type: 'JUMP_TO', index }), []);

  const seek = useCallback(
    (seconds) => {
      const { queue, currentIndex } = stateRef.current;
      const knownDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : queue[currentIndex]?.duration ?? 0;
      const target = clamp(seconds, 0, knownDuration);
      audio.currentTime = target;
      setProgress((previous) => ({ ...previous, currentTime: target }));
    },
    [audio],
  );
  const seekBy = useCallback((deltaSeconds) => seek(audio.currentTime + deltaSeconds), [audio, seek]);

  const previous = useCallback(() => {
    const { currentIndex, repeat } = stateRef.current;
    const canStepBack = currentIndex > 0 || repeat === 'all';
    if (audio.currentTime > RESTART_THRESHOLD_SECONDS || !canStepBack) {
      seek(0);
      return;
    }
    dispatch({ type: 'PREVIOUS' });
  }, [audio, seek]);

  const setVolume = useCallback((volume) => dispatch({ type: 'SET_VOLUME', volume }), []);
  const toggleMute = useCallback(() => dispatch({ type: 'TOGGLE_MUTE' }), []);
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), []);
  const cycleRepeat = useCallback(() => dispatch({ type: 'CYCLE_REPEAT' }), []);
  const isContextActive = useCallback((context) => isSameContext(state.context, context), [state.context]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = currentTrack
      ? new MediaMetadata({ title: currentTrack.title, artist: currentTrack.artistName, album: currentTrack.recordTitle })
      : null;
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = currentTrack ? (state.isPlaying ? 'playing' : 'paused') : 'none';
  }, [currentTrack, state.isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;
    const handlers = {
      play,
      pause,
      previoustrack: previous,
      nexttrack: next,
      seekto: (details) => {
        if (typeof details.seekTime === 'number') seek(details.seekTime);
      },
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    }
    return () => {
      for (const action of Object.keys(handlers)) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [play, pause, previous, next, seek]);

  const value = useMemo(
    () => ({
      queue: state.queue,
      currentIndex: state.currentIndex,
      currentTrack,
      context: state.context,
      isPlaying: state.isPlaying,
      isBuffering: state.isBuffering,
      shuffle: state.shuffle,
      repeat: state.repeat,
      volume: state.volume,
      isMuted: state.isMuted,
      playTracks,
      playTrack,
      play,
      pause,
      togglePlay,
      next,
      previous,
      jumpTo,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      isContextActive,
    }),
    [
      state,
      currentTrack,
      playTracks,
      playTrack,
      play,
      pause,
      togglePlay,
      next,
      previous,
      jumpTo,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      isContextActive,
    ],
  );

  return (
    <EngineContext.Provider value={audio}>
      <PlayerContext.Provider value={value}>
        <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
      </PlayerContext.Provider>
    </EngineContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within <PlayerProvider>');
  return context;
}

export function useProgress() {
  return useContext(ProgressContext);
}

export function usePlayerEngine() {
  return useContext(EngineContext);
}
