import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";
import { mainWindow } from "@main/main";
import { fail, ok } from "@shared/lib/rust-types/Result";
import errorIgnored from "@shared/lib/tungsten/errorIgnored";
import { Playlist, PlaylistInfo } from "@shared/types/common.types";
import crypto from "crypto";

const MAX_NAME_LENGTH = 100;

function playlists() {
  return Storage.getTable("playlists");
}

function validateName(name: string, ignoreID?: string): string | undefined {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Playlist name cannot be empty.";
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Playlist name cannot be longer than ${MAX_NAME_LENGTH} characters.`;
  }

  const lower = trimmed.toLowerCase();
  const struct = playlists().getStruct();
  for (const id in struct) {
    if (id !== ignoreID && struct[id].name.toLowerCase() === lower) {
      return `Playlist "${trimmed}" already exists.`;
    }
  }

  return undefined;
}

async function changed() {
  await Router.dispatch(mainWindow, "playlist::changed").catch(errorIgnored);
}

Router.respond("playlist::getAll", () => {
  const struct = playlists().getStruct();
  const result: PlaylistInfo[] = [];

  for (const id in struct) {
    const p = struct[id];
    result.push({ id: p.id, name: p.name, count: p.songs.length, createdAt: p.createdAt });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
});

Router.respond("playlist::create", async (_evt, name) => {
  const error = validateName(name);
  if (error !== undefined) {
    return fail(error);
  }

  const playlist: Playlist = {
    id: crypto.randomUUID(),
    name: name.trim(),
    songs: [],
    createdAt: Date.now(),
  };

  playlists().write(playlist.id, playlist);
  await changed();
  return ok(playlist.id);
});

Router.respond("playlist::rename", async (_evt, id, name) => {
  const playlist = playlists().get(id);
  if (playlist.isNone) {
    return fail("Playlist does not exist.");
  }

  const error = validateName(name, id);
  if (error !== undefined) {
    return fail(error);
  }

  playlists().write(id, { ...playlist.value, name: name.trim() });
  await changed();
  return ok(undefined);
});

Router.respond("playlist::delete", async (_evt, id) => {
  if (playlists().get(id).isNone) {
    return;
  }

  playlists().delete(id);
  await changed();
});

Router.respond("playlist::addSong", async (_evt, id, song) => {
  const playlist = playlists().get(id);
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

  playlists().write(id, { ...playlist.value, songs: [...playlist.value.songs, song] });
  await changed();
  return ok(undefined);
});

Router.respond("playlist::removeSong", async (_evt, id, song) => {
  const playlist = playlists().get(id);
  if (playlist.isNone) {
    return;
  }

  const songs = playlist.value.songs.filter((s) => s !== song);
  if (songs.length === playlist.value.songs.length) {
    return;
  }

  playlists().write(id, { ...playlist.value, songs });
  await changed();
});
