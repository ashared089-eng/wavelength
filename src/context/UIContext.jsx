import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const UIContext = createContext(null);
const INTRO_KEY = 'wavelength:intro';

function readIntroSeen() {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function UIProvider({ children }) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introSeen, setIntroSeen] = useState(readIntroSeen);
  const [environment, setEnvironment] = useState(null);
  const primaryAction = useRef(null);

  const finishIntro = useCallback(() => {
    setIntroSeen(true);
    try {
      window.sessionStorage.setItem(INTRO_KEY, 'seen');
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ playerOpen, setPlayerOpen, menuOpen, setMenuOpen, introSeen, finishIntro, environment, setEnvironment, primaryAction }),
    [playerOpen, menuOpen, introSeen, finishIntro, environment],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within <UIProvider>');
  return context;
}

export function useEnvironment(visual) {
  const { setEnvironment } = useUI();
  useEffect(() => {
    setEnvironment(visual ?? null);
  }, [visual, setEnvironment]);
}
