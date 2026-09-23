export function cx(...args) {
  const classes = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      classes.push(cx(...arg));
    } else if (typeof arg === 'object') {
      for (const [name, enabled] of Object.entries(arg)) {
        if (enabled) classes.push(name);
      }
    }
  }
  return classes.join(' ');
}
