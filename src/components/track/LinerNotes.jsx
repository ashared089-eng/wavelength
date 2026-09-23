import { useEffect, useRef } from 'react';
import { CloseGlyph } from '../ui/Glyphs.jsx';

export default function LinerNotes({ open, onClose, track, record, artist }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus({ preventScroll: true });
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  return (
    <>
      <button type="button" className="notes__scrim" data-open={open} tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <aside className="notes" data-open={open} inert={!open} aria-label="About the artist">
        <div className="notes__head">
          <p className="eyebrow">About the artist</p>
          <button ref={closeRef} type="button" className="notes__close" onClick={onClose} aria-label="Close">
            <CloseGlyph size={18} />
          </button>
        </div>
        <h2 className="notes__artist">{artist?.name ?? track.artistName}</h2>
        <p className="notes__origin">
          {artist?.origin}
          {artist?.origin ? ' — ' : ''}
          {(artist?.genres ?? []).join(', ')}
        </p>
        <p className="notes__bio">{artist?.bio}</p>
        <dl className="notes__facts">
          <div>
            <dt>Album</dt>
            <dd>{record?.title}</dd>
          </div>
          <div>
            <dt>Cat no.</dt>
            <dd>{track.catalogNo}</dd>
          </div>
          <div>
            <dt>Label</dt>
            <dd>{track.label}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{track.year}</dd>
          </div>
        </dl>
      </aside>
    </>
  );
}
