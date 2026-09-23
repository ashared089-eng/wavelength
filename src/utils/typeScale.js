export function titleSize(title) {
  const length = title.length;
  const longestWord = Math.max(...title.split(' ').map((word) => word.length));
  const singleLine = length <= 13;
  const lineLength = singleLine ? length : Math.max(longestWord, Math.ceil(length / 2) + 1);
  const byWidth = Math.min(singleLine ? 14.5 : 10.5, 168 / Math.max(lineLength, 6));
  const byHeight = singleLine ? 27 : 17;
  return `min(${byWidth.toFixed(2)}vw, ${byHeight}vh)`;
}
