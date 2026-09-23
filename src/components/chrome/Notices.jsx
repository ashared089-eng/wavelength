import { useToastList } from '../../context/ToastContext.jsx';

export default function Notices() {
  const { toasts, dismiss } = useToastList();

  return (
    <div className="notices" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} type="button" className="notice" data-tone={toast.tone} onClick={() => dismiss(toast.id)}>
          {toast.message}
        </button>
      ))}
    </div>
  );
}
