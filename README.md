# Wavelength

A really tuff music player


## Running locally

Requires Node.js 20.19+ (22 LTS recommended).

```bash
npm install
npm run dev
```

The app is served at **http://localhost:3000** (the port is fixed in
`vite.config.js` and `package.json`). `npm run build` produces a static bundle
in `dist/`, and `npm run preview` serves that bundle on port 3000.

### No Node.js installed (locked-down PC)?

Doubleclick `scripts\dev.cmd` then goto 'localhost:3000'

## what it is

20 records, 149 songs, and none of them are real recordings. every song gets
made up on the spot in your browser when you hit play, so it sounds the same
every time and works with no wifi. every record has its own cover (drawn in
code, no images) and its own way of moving, timed off the actual bpm of the
song.

## how to use it

- **home** - one song from every record. scroll, drag, swipe or use the arrow
  keys to flick through. the whole page changes colour to match.
- **song page** - tap a cover or hit open. big title, animation, play button,
  bpm and key, the rest of the album, and a bit about the artist.
- **songs** - the whole lot in a list (hover a song and the cover follows your
  mouse) or as a grid of covers. theres a search box too.
- **about** - what it is and the controls.

the good stuff:

- tap **space** to play/pause. **hold space** and it jumps to a random record.
  on your phone hold **random** in the player.
- **hold a cover** on a song page and the sound goes muffled like youre
  underwater till you let go.
- press **q** for the queue. **m** mutes. **,** and **.** do volume.

## how the sound works

`src/utils/synth.js` makes the song (tempo, key, chords, drums, melody) from
the song name and what kind of music the artist makes, then
`src/utils/synthPlayer.js` plays it live with web audio. it acts exactly like
an `<audio>` tag so the player code doesnt care where the sound comes from. if
you ever want real mp3s, return a url from `resolveAudioUrl` in
`src/data/audio.js` and it just uses that instead.

## where stuff is

```
src/
  data/        the records, artists and songs, plus visuals.js (colours, cover style
               and animation for each record)
  components/  art (the covers), chrome (nav, menu, intro, cursor, grain),
               player (bottom bar + big player), track (song page bits), type (text animations)
  pages/       HomePage, TrackPage, CollectionPage, AboutPage
  styles/      all the css
  utils/       synth + synthPlayer (the sound), random, typeScale, format
```

only react, react-dom and react-router-dom. no other libraries.

## hosting

its already set up for github pages. every push to `main` runs
`.github/workflows/deploy.yml`, which builds the site and puts it live at
`https://<your-username>.github.io/<repo-name>/`. first time only: go to the
repo's settings > pages and make sure the source says github actions.

it also works on netlify or vercel with zero setup, just import the repo.
