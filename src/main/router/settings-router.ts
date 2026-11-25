import { Router } from "@main/lib/route-pass/Router";
import { setSongIndexes } from "@main/lib/song";
import { Storage } from "@main/lib/storage/Storage";
import { app } from "electron";
import os from "os";

Router.respond("settings::get", (_evt, key) => {
  return Storage.getTable("settings").get(key);
});

Router.respond("settings::write", (_evt, key, value) => {
  Storage.getTable("settings").write(key, value);
});

Router.respond("settings::DeleteSongData", () => {
  Storage.getTable("settings").delete("osuSongsDir");
  Storage.removeTable("songs");
  setSongIndexes(undefined);
  // Make sure nothing is lost if the app is restarted right after
  Storage.flushAllSync();
});

Router.respond("os::platform", () => {
  return os.platform();
});

Router.respond("app::restart", () => {
  Storage.flushAllSync();
  app.relaunch();
  app.quit();
});
