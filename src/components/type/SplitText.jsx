import { cx } from '../../utils/classNames.js';

export default function SplitText({ text, by = 'char', className }) {
  let index = 0;
  const pieces = [];
  text.split(' ').forEach((word, position) => {
    if (position > 0) pieces.push(' ');
    const units = by === 'char' ? Array.from(word) : [word];
    pieces.push(
      <span key={`${word}-${position}`} className="split__word">
        {units.map((unit, offset) => {
          const order = index;
          index += 1;
          return (
            <span key={offset} className="split__unit" style={{ '--i': order }}>
              {unit}
            </span>
          );
        })}
      </span>,
    );
  });

  return (
    <span className={cx('split', className)} style={{ '--count': index }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{pieces}</span>
    </span>
  );
}
