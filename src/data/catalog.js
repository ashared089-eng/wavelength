import { artists as rawArtists } from './artists.js';
import { albums as rawAlbums } from './albums.js';
import { albumTracks } from './tracks.js';
import { resolveAudioUrl } from './audio.js';
import { DEFAULT_VISUAL, STAGE_ORDER, recordVisuals } from './visuals.js';

const TYPE_LABELS = { album: 'LP', ep: 'EP', single: 'Single' };

const pad = (value, size) => String(value).padStart(size, '0');

export const artists = rawArtists;
const artistById = new Map(artists.map((artist) => [artist.id, artist]));

const chronological = [...rawAlbums].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

export const records = chronological.map((album, index) => {
  const artist = artistById.get(album.artistId);
  const rows = albumTracks[album.id] ?? [];
  return {
    ...album,
    number: index + 1,
    catalogNo: `WL ${pad(index + 1, 3)}`,
    format: TYPE_LABELS[album.type] ?? 'LP',
    artistName: artist?.name ?? 'Unknown artist',
    genres: artist?.genres ?? [],
    visual: recordVisuals[album.id] ?? DEFAULT_VISUAL,
    trackCount: rows.length,
    totalDuration: rows.reduce((total, row) => total + row[1], 0),
  };
});
const recordById = new Map(records.map((record) => [record.id, record]));

export const tracks = records.flatMap((record) =>
  (albumTracks[record.id] ?? []).map(([title, duration, playsInMillions], index) => {
    const track = {
      id: `${record.id}-${index + 1}`,
      title,
      duration,
      plays: Math.round(playsInMillions * 1_000_000),
      number: index + 1,
      recordId: record.id,
      recordTitle: record.title,
      recordSize: record.trackCount,
      catalogNo: record.catalogNo,
      artistId: record.artistId,
      artistName: record.artistName,
      genres: record.genres,
      year: record.year,
      label: record.label,
      format: record.format,
      visual: record.visual,
    };
    track.audioUrl = resolveAudioUrl(track);
    return track;
  }),
);
tracks.forEach((track, index) => {
  track.index = index;
});
const trackById = new Map(tracks.map((track) => [track.id, track]));

export const getArtist = (id) => artistById.get(id) ?? null;
export const getRecord = (id) => recordById.get(id) ?? null;
export const getTrack = (id) => trackById.get(id) ?? null;

export function getRecordTracks(recordId) {
  return tracks.filter((track) => track.recordId === recordId);
}

export const stageSides = STAGE_ORDER.map((recordId) => trackById.get(`${recordId}-1`)).filter(Boolean);

export function getNeighbors(trackId) {
  const track = getTrack(trackId);
  if (!track) return { previous: null, next: null };
  return {
    previous: tracks[(track.index - 1 + tracks.length) % tracks.length],
    next: tracks[(track.index + 1) % tracks.length],
  };
}

export function pickDriftTrack(excludeRecordId) {
  const candidates = records.filter((record) => record.id !== excludeRecordId);
  const record = candidates[Math.floor(Math.random() * candidates.length)];
  const list = getRecordTracks(record.id);
  return list[Math.floor(Math.random() * Math.min(list.length, 3))];
}

export const recordContext = (record) => ({ type: 'record', id: record.id, name: record.title });

export const totals = {
  records: records.length,
  tracks: tracks.length,
  artists: artists.length,
  duration: tracks.reduce((total, track) => total + track.duration, 0),
};
