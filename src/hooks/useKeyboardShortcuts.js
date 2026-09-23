import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useUI } from '../context/UIContext.jsx';

const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 0.05;

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const player = usePlayer();
  const { playerOpen, setPlayerOpen, menuOpen, setMenuOpen } = useUI();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        else if (playerOpen) setPlayerOpen(false);
        return;
      }
      if (isTypingTarget(event.target)) return;
      const onStage = document.documentElement.dataset.route === 'home' && !playerOpen;

      switch (event.key) {
        case 'ArrowRight':
          if (event.shiftKey) player.next();
          else if (!onStage) player.seekBy(SEEK_STEP_SECONDS);
          else return;
          event.preventDefault();
          break;
        case 'ArrowLeft':
          if (event.shiftKey) player.previous();
          else if (!onStage) player.seekBy(-SEEK_STEP_SECONDS);
          else return;
          event.preventDefault();
          break;
        case '.':
          player.setVolume(player.volume + VOLUME_STEP);
          break;
        case ',':
          player.setVolume(player.volume - VOLUME_STEP);
          break;
        case 'm':
        case 'M':
          player.toggleMute();
          break;
        case 'r':
        case 'R':
          player.cycleRepeat();
          break;
        case 's':
        case 'S':
          player.toggleShuffle();
          break;
        case 'q':
        case 'Q':
          if (player.currentTrack) setPlayerOpen(!playerOpen);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, playerOpen, setPlayerOpen, menuOpen, setMenuOpen]);
}
