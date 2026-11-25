import { getSongIndexes } from "@main/lib/song";
import { filter } from "@main/lib/song/filter";
import { indexMapper } from "@main/lib/song/indexMapper";
import { sortSongs } from "@main/lib/song/order";
import { getViewIndexes } from "@main/lib/song/view";
import { Storage } from "@main/lib/storage/Storage";
import { SongIndex, Song, SongsQueryPayload, QueueView } from "@shared/types/common.types";

export type SongsQuery = Omit<SongsQueryPayload, "view"> & { view: QueueView };

type CacheEntry = {
  key: string;
  indexes: SongIndex[];
  playlistsRevision: number;
  songs: Song[];
};

// Last result. Infinite scroller requests the same query page by page, so caching a single entry is enough to avoid
// re-filtering and re-sorting the whole library for every page
let cache: CacheEntry | undefined = undefined;

function cacheKey(query: SongsQuery): string {
  return JSON.stringify([query.view, query.searchQuery, query.tags, query.order]);
}

/**
 * Songs matching given view, search query and tags, sorted by given order. The result is cached and shared, so it must
 * NOT be mutated. Copy it first (`.slice()`) if you need to
 */
export function querySongs(query: SongsQuery): readonly Song[] {
  const key = cacheKey(query);
  // Cache is invalidated when songs are re-imported (new indexes array) or any playlist changes
  const indexes = getSongIndexes();
  const playlistsRevision = Storage.getTable("playlists").revision();

  if (
    cache !== undefined &&
    cache.key === key &&
    cache.indexes === indexes &&
    cache.playlistsRevision === playlistsRevision
  ) {
    return cache.songs;
  }

  const songs = Array.from(indexMapper(filter(getViewIndexes(query.view), query)));
  sortSongs(songs, query.order);

  cache = { key, indexes, playlistsRevision, songs };
  return songs;
}
