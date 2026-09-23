import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../../utils/classNames.js';

export default function Swap({ swapKey, exitMs = 700, as: Tag = 'div', className, children, ...rest }) {
  const [leaving, setLeaving] = useState(null);
  const lastKey = useRef(swapKey);
  const lastNode = useRef(children);
  const Item = Tag === 'span' ? 'span' : 'div';

  useLayoutEffect(() => {
    if (lastKey.current === swapKey) return;
    setLeaving({ key: lastKey.current, node: lastNode.current });
    lastKey.current = swapKey;
  }, [swapKey]);

  useLayoutEffect(() => {
    lastNode.current = children;
  });

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = window.setTimeout(() => setLeaving(null), exitMs);
    return () => window.clearTimeout(timer);
  }, [leaving, exitMs]);

  return (
    <Tag className={cx('swap', className)} {...rest}>
      {leaving && leaving.key !== swapKey ? (
        <Item key={leaving.key} className="swap__item" data-phase="exit" aria-hidden="true">
          {leaving.node}
        </Item>
      ) : null}
      <Item key={swapKey} className="swap__item" data-phase="enter">
        {children}
      </Item>
    </Tag>
  );
}
