import { useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useMagnetic } from '../../hooks/useMagnetic.js';
import { useScrollDirection } from '../../hooks/useScrollDirection.js';
import { SoundBars } from '../ui/Glyphs.jsx';

function MagneticLink({ to, children }) {
  const ref = useRef(null);
  useMagnetic(ref, 0.28);
  return (
    <NavLink ref={ref} to={to} className="nav__link" viewTransition>
      <span>{children}</span>
    </NavLink>
  );
}

export default function Nav() {
  const { direction, atTop } = useScrollDirection();
  const { menuOpen, setMenuOpen } = useUI();
  const { isPlaying, isMuted, toggleMute } = usePlayer();
  const hidden = direction === 'down' && !atTop && !menuOpen;

  return (
    <header className="nav" data-hidden={hidden}>
      <Link to="/" className="nav__mark" viewTransition aria-label="Wavelength, back to the start">
        Wavelength
      </Link>
      <nav className="nav__links" aria-label="Main">
        <MagneticLink to="/collection">Songs</MagneticLink>
        <MagneticLink to="/about">About</MagneticLink>
        <button type="button" className="nav__sound" onClick={toggleMute} aria-pressed={!isMuted}>
          <SoundBars active={isPlaying && !isMuted} />
          <span>{isMuted ? 'Sound off' : 'Sound on'}</span>
        </button>
      </nav>
      <button type="button" className="nav__menu" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="menu">
        Menu
      </button>
    </header>
  );
}
