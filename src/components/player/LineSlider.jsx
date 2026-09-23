import { useRef, useState } from 'react';
import { clamp } from '../../utils/array.js';
import { cx } from '../../utils/classNames.js';

export default function LineSlider({ value, max, step = 1, bigStep = step * 5, label, valueText, onScrub, onCommit, disabled = false, formatTooltip, className }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(null);
  const ratio = max > 0 ? clamp(value / max, 0, 1) : 0;

  const ratioAt = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    return rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
  };

  const handlePointerDown = (event) => {
    if (disabled || (event.button !== undefined && event.button !== 0)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
    onScrub?.(ratioAt(event.clientX) * max);
  };
  const handlePointerMove = (event) => {
    if (disabled) return;
    const next = ratioAt(event.clientX);
    setHover(next);
    if (dragging) onScrub?.(next * max);
  };
  const handlePointerUp = (event) => {
    if (!dragging) return;
    setDragging(false);
    onCommit?.(ratioAt(event.clientX) * max);
  };
  const handlePointerCancel = () => {
    if (!dragging) return;
    setDragging(false);
    onCommit?.(value);
  };
  const handleKeyDown = (event) => {
    if (disabled) return;
    const moves = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: bigStep, PageDown: -bigStep };
    let target = null;
    if (event.key in moves) target = value + moves[event.key];
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = max;
    if (target === null) return;
    event.preventDefault();
    event.stopPropagation();
    onCommit?.(clamp(target, 0, max));
  };

  return (
    <div
      ref={ref}
      className={cx('line', className)}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max * 100) / 100}
      aria-valuenow={Math.round(value * 100) / 100}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      data-dragging={dragging}
      style={{ '--ratio': ratio, '--hover': hover ?? ratio }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={() => setHover(null)}
      onKeyDown={handleKeyDown}
    >
      <span className="line__track" />
      <span className="line__fill" />
      <span className="line__thumb" />
      {formatTooltip && hover !== null && !disabled ? <span className="line__tip">{formatTooltip(hover * max)}</span> : null}
    </div>
  );
}
