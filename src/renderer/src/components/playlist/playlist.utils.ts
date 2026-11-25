import { addNotice } from "@renderer/components/notice/NoticeContainer";
import { PlaylistID, PlaylistInfo, Song } from "@shared/types/common.types";
import { createSignal } from "solid-js";

const [playlists, setPlaylists] = createSignal<PlaylistInfo[]>([]);
export { playlists };

export async function refreshPlaylists(): Promise<void> {
  setPlaylists(await window.api.request("playlist::getAll"));
}

window.api.listen("playlist::changed", refreshPlaylists);
refreshPlaylists();

// Playlist currently opened in Playlists tab. undefined = list of playlists is shown
export const [openedPlaylist, setOpenedPlaylist] = createSignal<PlaylistID | undefined>();

// Song for which the "Add to playlist" picker is open. undefined = picker is closed
export const [pickerSong, setPickerSong] = createSignal<Song | undefined>();

export function openPlaylistPicker(song: Song): void {
  setPickerSong(song);
}

export function closePlaylistPicker(): void {
  setPickerSong(undefined);
}

function notifyError(title: string, description: string): void {
  addNotice({ variant: "error", title, description });
}

/**
 * Create playlist. Returns its ID on success, otherwise shows error notice and returns undefined
 */
export async function createPlaylist(name: string): Promise<PlaylistID | undefined> {
  const result = await window.api.request("playlist::create", name);

  if (result.isError) {
    notifyError("Could not create playlist", result.error);
    return undefined;
  }

  return result.value;
}

export async function renamePlaylist(id: PlaylistID, name: string): Promise<boolean> {
  const result = await window.api.request("playlist::rename", id, name);

  if (result.isError) {
    notifyError("Could not rename playlist", result.error);
    return false;
  }

  return true;
}

export async function deletePlaylist(id: PlaylistID): Promise<void> {
  if (openedPlaylist() === id) {
    setOpenedPlaylist(undefined);
  }

  await window.api.request("playlist::delete", id);
}

export async function addSongToPlaylist(id: PlaylistID, song: Song): Promise<boolean> {
  const result = await window.api.request("playlist::addSong", id, song.audio);

  if (result.isError) {
    notifyError("Could not add song", result.error);
    return false;
  }

  const name = playlists().find((p) => p.id === id)?.name ?? "playlist";
  addNotice({
    variant: "success",
    title: "Added to playlist",
    description: `${song.title} was added to ${name}.`,
  });
  return true;
}

export async function removeSongFromPlaylist(id: PlaylistID, song: Song): Promise<void> {
  await window.api.request("playlist::removeSong", id, song.audio);
}
