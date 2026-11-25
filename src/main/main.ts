import { configureOsuDir } from "@main/lib/osu-import";
import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";
import { showError } from "@main/router/error-router";
import "@main/router/import";
import { orDefault } from "@shared/lib/rust-types/Optional";
import { BrowserWindow } from "electron";

export let mainWindow: BrowserWindow;

export async function main(window: BrowserWindow) {
  mainWindow = window;

  const settings = Storage.getTable("settings");

  // Deleting osuSongsDir will force initial beatmap import
  // settings.delete("osuSongsDir");
  const osuSongsDir = settings.get("osuSongsDir");

  if (osuSongsDir.isNone) {
    await configureOsuDir(window, false);
  } else {
    //TODO: check for updates in song files
  }

  if (isEmpty(Storage.getTable("songs").getStruct())) {
    await showError(
      window,
      `No songs found in folder: ${orDefault(
        settings.get("osuSongsDir"),
        "[No folder]",
      )}. Please make sure this is the directory where you have all your songs saved.`,
    );
    await configureOsuDir(window, false);
  }

  await Router.dispatch(window, "changeScene", "main");
}

function isEmpty(obj: object): boolean {
  for (const _ in obj) {
    return false;
  }

  return true;
}
