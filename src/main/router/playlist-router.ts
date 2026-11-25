import {
  createPlaylist,
  playlistsChanged,
  playlistsTable,
  validatePlaylistName,
} from "@main/lib/playlist";
import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";
import { fail, ok } from "@shared/lib/rust-types/Result";
import { PlaylistInfo } from "@shared/types/common.types";

Router.respond("playlist::getAll", () => {
  const struct = playlistsTable().getStruct();
  const result: PlaylistInfo[] = [];

  for (const id in struct) {
    const p = struct[id];
    result.push({ id: p.id, name: p.name, count: p.songs.length, createdAt: p.createdAt });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
});

Router.respond("playlist::create", (_evt, name) => createPlaylist(name));

Router.respond("playlist::rename", async (_evt, id, name) => {
  const playlist = playlistsTable().get(id);
  if (playlist.isNone) {
    return fail("Playlist does not exist.");
  }

  const error = validatePlaylistName(name, id);
  if (error !== undefined) {
    return fail(error);
  }

  playlistsTable().write(id, { ...playlist.value, name: name.trim() });
  await playlistsChanged();
  return ok(undefined);
});

Router.respond("playlist::delete", async (_evt, id) => {
  if (playlistsTable().get(id).isNone) {
    return;
  }

  playlistsTable().delete(id);
  await playlistsChanged();
});

Router.respond("playlist::addSong", async (_evt, id, song) => {
  const playlist = playlistsTable().get(id);
  if (playlist.isNone) {
    return fail("Playlist does not exist.");
  }

  if (Storage.getTable("songs").get(song).isNone) {
    return fail("Song does not exist.");
  }

  if (playlist.value.songs.includes(song)) {
    // Adding a song that is already present is a no-op
    return ok(undefined);
  }

  playlistsTable().write(id, { ...playlist.value, songs: [...playlist.value.songs, song] });
  await playlistsChanged();
  return ok(undefined);
});

Router.respond("playlist::removeSong", async (_evt, id, song) => {
  const playlist = playlistsTable().get(id);
  if (playlist.isNone) {
    return;
  }

  const songs = playlist.value.songs.filter((s) => s !== song);
  if (songs.length === playlist.value.songs.length) {
    return;
  }

  playlistsTable().write(id, { ...playlist.value, songs });
  await playlistsChanged();
});
