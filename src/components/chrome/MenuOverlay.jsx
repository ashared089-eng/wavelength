import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { totals } from '../../data/catalog.js';
import { SoundBars } from '../ui/Glyphs.jsx';

const LINKS = [
  { to: '/', label: 'Home', note: 'pick a record' },
  { to: '/collection', label: 'Songs', note: `all ${totals.tracks} of them` },
  { to: '/about', label: 'About', note: 'what even is this' },
];

export default function MenuOverlay() {
  const { menuOpen, setMenuOpen } = useUI();
  const { currentTrack, isPlaying, isMuted, toggleMute } = usePlayer();
  const location = useLocation();
  const closeRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, setMenuOpen]);

  useEffect(() => {
    if (menuOpen) closeRef.current?.focus({ preventScroll: true });
  }, [menuOpen]);

  return (
    <div id="menu" className="menu" data-open={menuOpen} inert={!menuOpen} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="menu__head">
        <span className="menu__mark">Wavelength</span>
        <button ref={closeRef} type="button" className="menu__close" onClick={() => setMenuOpen(false)}>
          Close
        </button>
      </div>
      <ul className="menu__list">
        {LINKS.map((link, index) => (
          <li key={link.to} style={{ '--i': index }}>
            <Link to={link.to} className="menu__link" viewTransition aria-current={location.pathname === link.to ? 'page' : undefined}>
              <span className="menu__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="menu__word">{link.label}</span>
              <span className="menu__note">{link.note}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="menu__foot">
        {currentTrack ? (
          <Link to={`/track/${currentTrack.id}`} className="menu__now" viewTransition>
            <SoundBars active={isPlaying} />
            <span>
              {currentTrack.title} — {currentTrack.artistName}
            </span>
          </Link>
        ) : (
          <span className="menu__now">nothing playing yet</span>
        )}
        <button type="button" className="menu__sound" onClick={toggleMute} aria-pressed={!isMuted}>
          {isMuted ? 'Sound off' : 'Sound on'}
        </button>
      </div>
    </div>
  );
}
