import { DirParseResult, OsuParser } from "@main/lib/osu-file-parser/OsuParser";
import { Router } from "@main/lib/route-pass/Router";
import { indexSongs, setSongIndexes } from "@main/lib/song";
import { Storage } from "@main/lib/storage/Storage";
import { throttle } from "@main/lib/throttle";
import { dirSubmit } from "@main/router/dir-router";
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
    await configureOsuDir(window);
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
    await configureOsuDir(window);
  }

  await Router.dispatch(window, "changeScene", "main");
}

function isEmpty(obj: object): boolean {
  for (const _ in obj) {
    return false;
  }

  return true;
}

// Update client progress bar 50 times a second
const UPDATE_DELAY_MS = 1_000 / 50;

async function configureOsuDir(mainWindow: BrowserWindow) {
  let parsed: Awaited<DirParseResult>;
  const settings = Storage.getTable("settings");

  while (true) {
    await Router.dispatch(mainWindow, "changeScene", "dir-select");
    const dirData = await dirSubmit();

    await Router.dispatch(mainWindow, "changeScene", "loading");
    await Router.dispatch(mainWindow, "loadingScene::setTitle", "Importing songs from osu!");

    // Wrap client update function to update only every UPDATE_DELAY_MS
    const [update, cancelUpdate] = throttle(async (i: number, total: number, file: string) => {
      await Router.dispatch(mainWindow, "loadingScene::update", {
        current: i,
        max: total,
        hint: file,
      });
    }, UPDATE_DELAY_MS);

    if (dirData.version == "stable") {
      parsed = await OsuParser.parseStableDatabase(dirData.path, update);
    } else {
      parsed = await OsuParser.parseLazerDatabase(dirData.path, update);
    }
    // Cancel ongoing throttled update, so it does not look bad when it finishes and afterward the update overwrites
    // finished state
    cancelUpdate();

    if (parsed.isError) {
      await showError(mainWindow, parsed.error);
      // Try again
      continue;
    }

    if (parsed.value.size === 0) {
      await showError(
        mainWindow,
        `No songs found in folder: ${dirData.path}. Please make sure this is the directory where you have all your songs saved.`,
      );
      // Try again
      continue;
    }

    // All went smoothly. Save osu directory and continue with import procedure
    settings.write("osuSongsDir", dirData.path);
    break;
  }

  const total = parsed.value.size;

  // Show finished state
  await Router.dispatch(mainWindow, "loadingScene::update", {
    max: total,
    current: total,
    hint: `Imported total of ${total} songs`,
  });

  // Save songs (written to disk asynchronously)
  const songs = Object.fromEntries(parsed.value);
  Storage.setTable("songs", songs);

  // Start indexing songs
  await Router.dispatch(mainWindow, "loadingScene::setTitle", "Indexing songs");

  // Wrap client update function to update only every UPDATE_DELAY_MS
  const [update, cancelUpdate] = throttle(async (i: number, song: string) => {
    await Router.dispatch(mainWindow, "loadingScene::update", {
      current: i,
      hint: song,
      max: total,
    });
  }, UPDATE_DELAY_MS);

  setSongIndexes(indexSongs(songs, update));
  // Cancel ongoing throttled update, so it does not look bad when it finishes and afterward the update overwrites
  // finished state
  cancelUpdate();

  // Persist the import right away. It is expensive to redo if the app gets killed
  await Storage.flushAll();

  // Display finished state
  await Router.dispatch(mainWindow, "loadingScene::update", {
    current: total,
    hint: "Indexed " + total + " songs",
    max: total,
  });
}
