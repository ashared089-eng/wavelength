import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { DriftProvider } from '../../context/DriftContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import PlayerDock from '../player/PlayerDock.jsx';
import Ambient from './Ambient.jsx';
import Cursor from './Cursor.jsx';
import DriftMeter from './DriftMeter.jsx';
import Grain from './Grain.jsx';
import Intro from './Intro.jsx';
import MenuOverlay from './MenuOverlay.jsx';
import Nav from './Nav.jsx';
import Notices from './Notices.jsx';
import PageLoader from './PageLoader.jsx';

const NEUTRAL = { a: '#8d8a84', b: '#4a4741' };

function Frame() {
  const location = useLocation();
  const { currentTrack, isPlaying } = usePlayer();
  const { environment, playerOpen, menuOpen } = useUI();
  useKeyboardShortcuts();

  const route = location.pathname === '/' ? 'home' : location.pathname.split('/')[1] || 'home';
  const visual = environment ?? currentTrack?.visual ?? NEUTRAL;

  useEffect(() => {
    document.documentElement.dataset.route = route;
  }, [route]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tint', visual.a);
    root.style.setProperty('--tint-2', visual.b);
  }, [visual]);

  useEffect(() => {
    document.documentElement.dataset.playing = String(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    document.documentElement.dataset.overlay = String(playerOpen || menuOpen);
  }, [playerOpen, menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Ambient />
      <Nav />
      <main id="main" className="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <PlayerDock />
      <MenuOverlay />
      <DriftMeter />
      <Notices />
      <Grain />
      <Cursor />
      <Intro />
      <ScrollRestoration />
    </>
  );
}

export default function Shell() {
  return (
    <DriftProvider>
      <Frame />
    </DriftProvider>
  );
}
