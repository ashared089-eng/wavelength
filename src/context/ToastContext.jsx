import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastActionsContext = createContext(null);
const ToastListContext = createContext([]);

const DEFAULT_DURATION_MS = 2600;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, { tone = 'default', duration = DEFAULT_DURATION_MS } = {}) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const actions = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastListContext.Provider value={toasts}>{children}</ToastListContext.Provider>
    </ToastActionsContext.Provider>
  );
}

export function useToast() {
  const actions = useContext(ToastActionsContext);
  if (!actions) throw new Error('useToast must be used within <ToastProvider>');
  return actions.toast;
}

export function useToastList() {
  const toasts = useContext(ToastListContext);
  const actions = useContext(ToastActionsContext);
  return { toasts, dismiss: actions.dismiss };
}
