import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";

Router.respond("save::songColors", (_evt, primaryColor, secondaryColor, songID) => {
  const songs = Storage.getTable("songs");
  const song = songs.get(songID);

  if (
    song.isNone ||
    (song.value.primaryColor === primaryColor && song.value.secondaryColor === secondaryColor)
  ) {
    return;
  }

  // Song is mutated in place (queue holds references to the same objects). Table writes are debounced, so extracting
  // colors of many songs while scrolling ends up as a few disk writes instead of one per song
  song.value.primaryColor = primaryColor;
  song.value.secondaryColor = secondaryColor;
  songs.markDirty();
});
