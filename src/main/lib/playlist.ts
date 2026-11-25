import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";
import { mainWindow } from "@main/main";
import { fail, ok } from "@shared/lib/rust-types/Result";
import errorIgnored from "@shared/lib/tungsten/errorIgnored";
import { Playlist, PlaylistID, ResourceID, Result } from "@shared/types/common.types";
import crypto from "crypto";

const MAX_NAME_LENGTH = 100;

export function playlistsTable() {
  return Storage.getTable("playlists");
}

/**
 * @returns error message or undefined if the name is valid
 */
export function validatePlaylistName(name: string, ignoreID?: PlaylistID): string | undefined {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Playlist name cannot be empty.";
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Playlist name cannot be longer than ${MAX_NAME_LENGTH} characters.`;
  }

  const lower = trimmed.toLowerCase();
  const struct = playlistsTable().getStruct();
  for (const id in struct) {
    if (id !== ignoreID && struct[id].name.toLowerCase() === lower) {
      return `Playlist "${trimmed}" already exists.`;
    }
  }

  return undefined;
}

export async function playlistsChanged(): Promise<void> {
  await Router.dispatch(mainWindow, "playlist::changed").catch(errorIgnored);
}

/**
 * Create and persist new playlist. Duplicate songs are removed (first occurrence is kept)
 */
export async function createPlaylist(
  name: string,
  songs: ResourceID[] = [],
): Promise<Result<PlaylistID, string>> {
  const error = validatePlaylistName(name);
  if (error !== undefined) {
    return fail(error);
  }

  const playlist: Playlist = {
    id: crypto.randomUUID(),
    name: name.trim(),
    songs: Array.from(new Set(songs)),
    createdAt: Date.now(),
  };

  playlistsTable().write(playlist.id, playlist);
  await playlistsChanged();
  return ok(playlist.id);
}
