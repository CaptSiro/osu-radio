import { getSongIndexes } from "@main/lib/song";
import { Storage } from "@main/lib/storage/Storage";
import { QueueView, ResourceID, SongIndex } from "@shared/types/common.types";

function allIndexes(): SongIndex[] {
  return getSongIndexes();
}

/**
 * Indexes of songs contained in given playlists. Songs that no longer exist (e.g. removed after re-import) are
 * skipped. Duplicates across playlists are included only once
 */
function playlistIndexes(ids: string[]): SongIndex[] {
  const table = Storage.getTable("playlists");
  const wanted = new Set<ResourceID>();

  for (const id of ids) {
    const playlist = table.get(id);
    if (playlist.isNone) {
      continue;
    }

    for (const song of playlist.value.songs) {
      wanted.add(song);
    }
  }

  if (wanted.size === 0) {
    return [];
  }

  return allIndexes().filter((index) => wanted.has(index.id));
}

/**
 * Resolve which songs belong to given view (all songs, single playlist, multiple playlists)
 */
export function getViewIndexes(view: QueueView): SongIndex[] {
  if (view.playlists !== undefined) {
    return playlistIndexes(view.playlists);
  }

  if (view.playlist !== undefined) {
    return playlistIndexes([view.playlist]);
  }

  if (view.isAllSongs) {
    return allIndexes();
  }

  return [];
}
