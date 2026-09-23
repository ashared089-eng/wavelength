import { useEffect, useState } from 'react';

function createGrainTexture(size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.random() * 255;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = Math.random() * 52;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function Grain() {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    setTexture(createGrainTexture());
  }, []);

  if (!texture) return null;
  return <div className="grain" aria-hidden="true" style={{ backgroundImage: `url(${texture})` }} />;
}
