function Glyph({ children, size = 20, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export function PlayGlyph(props) {
  return (
    <Glyph {...props}>
      <path d="M7.5 4.8v14.4L19.5 12z" />
    </Glyph>
  );
}

export function PauseGlyph(props) {
  return (
    <Glyph {...props}>
      <rect x="6.5" y="5" width="3.6" height="14" />
      <rect x="13.9" y="5" width="3.6" height="14" />
    </Glyph>
  );
}

export function PreviousGlyph(props) {
  return (
    <Glyph {...props}>
      <rect x="5" y="6" width="2" height="12" />
      <path d="M19 6v12l-10-6z" />
    </Glyph>
  );
}

export function NextGlyph(props) {
  return (
    <Glyph {...props}>
      <rect x="17" y="6" width="2" height="12" />
      <path d="M5 6v12l10-6z" />
    </Glyph>
  );
}

export function ArrowGlyph({ direction = 'right', ...props }) {
  const rotation = { right: 0, down: 90, left: 180, up: 270 }[direction] ?? 0;
  return (
    <Glyph fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: `rotate(${rotation}deg)` }} {...props}>
      <path d="M4 12h15.5M13.5 5.5 20 12l-6.5 6.5" />
    </Glyph>
  );
}

export function CloseGlyph(props) {
  return (
    <Glyph fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </Glyph>
  );
}

export function SoundBars({ active = false }) {
  return (
    <span className="soundbars" data-active={active} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
