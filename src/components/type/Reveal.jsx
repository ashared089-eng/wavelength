import { useRef } from 'react';
import { useInView } from '../../hooks/useInView.js';
import { cx } from '../../utils/classNames.js';

export default function Reveal({ as: Tag = 'div', className, delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref);

  return (
    <Tag ref={ref} className={cx('reveal', className)} data-inview={inView} style={{ '--reveal-delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
