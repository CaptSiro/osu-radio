import { averageBPM, msToBPM } from "./average-bpm";
import { Storage } from "@main/lib/storage/Storage";
import { Song, SongIndex } from "@shared/types/common.types";

function createSongIndex(id: string, song: Song): SongIndex {
  return {
    id,
    t: (song.beatmapSetID + song.title + (song.titleUnicode ?? "")).toLowerCase(),
    a: (song.artist + (song.artistUnicode ?? "")).toLowerCase(),
    c: song.creator.toLowerCase(),
    d: song.duration,
    m: song.mode,
    tags: song.tags,
    diffs: song.diffs,
    bpm: msToBPM(averageBPM(song.bpm, song.duration * 1_000)),
  };
}

export type IndexCallback = (i: number, song: string) => void;

/**
 * Create search index for each song
 * @see {SongIndex}
 */
export function indexSongs(songs: { [id: string]: Song }, fn?: IndexCallback): SongIndex[] {
  const indexes: SongIndex[] = [];
  let i = 0;

  for (const id in songs) {
    i++;
    const song = songs[id];

    if (fn !== undefined) {
      // Update client progress bar
      fn(i, song.artist + " - " + song.title);
    }

    indexes.push(createSongIndex(id, song));
  }

  return indexes;
}

// Indexes are derived from the songs table, so they are kept only in memory instead of duplicating song data on disk
let cachedIndexes: SongIndex[] | undefined = undefined;

/**
 * Search indexes of all songs. Built lazily from songs table on first use
 */
export function getSongIndexes(): SongIndex[] {
  if (cachedIndexes === undefined) {
    cachedIndexes = indexSongs(Storage.getTable("songs").getStruct());
  }

  return cachedIndexes;
}

/**
 * Replace cached indexes, or drop them (`undefined`) so they are rebuilt on next use. Must be called whenever songs
 * table is replaced or removed
 */
export function setSongIndexes(indexes: SongIndex[] | undefined): void {
  cachedIndexes = indexes;
}
