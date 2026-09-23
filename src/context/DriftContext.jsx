import { createContext, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { pickDriftTrack } from '../data/catalog.js';
import { useDrift } from '../hooks/useDrift.js';
import { usePlayer } from './PlayerContext.jsx';
import { useUI } from './UIContext.jsx';

const DriftContext = createContext(null);

export function DriftProvider({ children }) {
  const navigate = useNavigate();
  const { currentTrack, playTrack, togglePlay } = usePlayer();
  const { introSeen, primaryAction, setPlayerOpen, setMenuOpen } = useUI();

  const handleTap = useCallback(() => {
    if (primaryAction.current?.() === true) return;
    togglePlay();
  }, [primaryAction, togglePlay]);

  const handleComplete = useCallback(() => {
    const target = pickDriftTrack(currentTrack?.recordId);
    setPlayerOpen(false);
    setMenuOpen(false);
    playTrack(target);
    navigate(`/track/${target.id}`, { viewTransition: true });
  }, [currentTrack, playTrack, navigate, setPlayerOpen, setMenuOpen]);

  const holdProps = useDrift({ onTap: handleTap, onComplete: handleComplete, enabled: introSeen });

  return <DriftContext.Provider value={holdProps}>{children}</DriftContext.Provider>;
}

export function useDriftHold() {
  return useContext(DriftContext);
}
