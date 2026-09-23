export function isSameContext(a, b) {
  return Boolean(a && b && a.type === b.type && a.id === b.id);
}
