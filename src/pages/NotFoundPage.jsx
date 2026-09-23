import { Link } from 'react-router-dom';
import SplitText from '../components/type/SplitText.jsx';
import { ArrowGlyph } from '../components/ui/Glyphs.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Nothing here');

  return (
    <div className="lost">
      <p className="eyebrow">404</p>
      <h1 className="lost__title">
        <SplitText text="Nothing here" />
      </h1>
      <p className="lost__text">This page doesn&rsquo;t exist. No idea how you ended up here tbh.</p>
      <Link to="/" className="about__link" viewTransition>
        <span>Back to the start</span>
        <ArrowGlyph size={28} />
      </Link>
    </div>
  );
}
