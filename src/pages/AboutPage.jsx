import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/type/Reveal.jsx';
import SplitText from '../components/type/SplitText.jsx';
import { ArrowGlyph } from '../components/ui/Glyphs.jsx';
import { useUI } from '../context/UIContext.jsx';
import { totals } from '../data/catalog.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const CONTROLS = [
  ['Space', 'play / pause'],
  ['Hold Space', 'jump to a random record'],
  ['← →', 'flick through records (or skip 5 secs on a song page)'],
  ['Shift ← →', 'previous / next song'],
  ['Enter', 'open the record you’re on'],
  [', .', 'volume down / up'],
  ['M', 'mute'],
  ['S · R', 'shuffle · repeat'],
  ['Q', 'open the queue'],
  ['Esc', 'close whatever’s open'],
];

const STACK = [
  ['Fonts', 'Instrument Serif + Instrument Sans'],
  ['Sound', 'Web Audio, made live, zero mp3s'],
  ['Covers', '20 designs drawn in code (SVG)'],
  ['Built with', 'React, React Router and plain CSS'],
];

export default function AboutPage() {
  const { setEnvironment } = useUI();
  useDocumentTitle('About');

  useEffect(() => {
    setEnvironment(null);
  }, [setEnvironment]);

  return (
    <div className="about">
      <header className="about__head">
        <p className="eyebrow">About</p>
        <h1 className="about__title">
          <SplitText text="So what is this?" by="word" />
        </h1>
      </header>

      <Reveal as="p" className="about__lede">
        Wavelength is a music player I made. {totals.records} records, {totals.artists} artists, {totals.tracks} songs, and <em>none of them are real recordings</em>. Every
        song gets made up on the spot in your browser when you hit play, so it sounds the same every time and it works with no wifi.
      </Reveal>

      <Reveal as="p" className="about__lede">
        Every record has its own cover, its own colours and its own way of moving. One slides sideways, one zooms in really slowly, one bounces the title to
        the beat, one just sits there. It all runs off the <em>actual BPM</em> of the song. Hold a cover down and the sound goes all muffled like you&rsquo;re
        underwater, then let go.
      </Reveal>

      <section className="about__grid">
        <Reveal className="about__block">
          <h2 className="eyebrow">Controls</h2>
          <dl className="keys">
            {CONTROLS.map(([key, action]) => (
              <div key={key} className="keys__row">
                <dt>
                  <kbd>{key}</kbd>
                </dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal className="about__block" delay={120}>
          <h2 className="eyebrow">Made with</h2>
          <dl className="keys">
            {STACK.map(([term, value]) => (
              <div key={term} className="keys__row">
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="about__note">
            On your phone: swipe to look through the records, tap a cover to open it, and hold <em>Random</em> to jump somewhere new.
          </p>
        </Reveal>
      </section>

      <Reveal className="about__cta">
        <Link to="/" className="about__link" viewTransition>
          <span>Back to the start</span>
          <ArrowGlyph size={28} />
        </Link>
      </Reveal>
    </div>
  );
}
