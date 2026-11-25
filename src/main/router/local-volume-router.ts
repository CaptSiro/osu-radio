import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";

Router.respond("save::localVolume", (_evt, localVolume, songID) => {
  const songs = Storage.getTable("songs");
  const song = songs.get(songID);

  if (song.isNone || song.value.volume === localVolume) {
    return;
  }

  // Table writes are debounced, so rapid slider changes end up as a single disk write
  song.value.volume = localVolume;
  songs.markDirty();
});
