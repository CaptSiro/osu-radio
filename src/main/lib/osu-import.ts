import { OsuParser } from "@main/lib/osu-file-parser/OsuParser";
import { Router } from "@main/lib/route-pass/Router";
import { indexSongs, setSongIndexes } from "@main/lib/song";
import { Storage } from "@main/lib/storage/Storage";
import { throttle } from "@main/lib/throttle";
import { detectOsuDir, dirSubmit } from "@main/router/dir-router";
import { showError } from "@main/router/error-router";
import { fail, ok } from "@shared/lib/rust-types/Result";
import { Result, Song } from "@shared/types/common.types";
import { OsuDirectory } from "@shared/types/router.types";
import { BrowserWindow } from "electron";

// Update client progress bar 50 times a second
const UPDATE_DELAY_MS = 1_000 / 50;

let isImporting = false;

/**
 * Parse given osu! installation and replace song library with it. Loading scene is shown during the import. Current
 * library is kept untouched when the import fails.
 *
 * User data of songs that are present in both old and new library (colors, volume) is carried over.
 *
 * @returns number of imported songs or error message
 */
export async function importOsuDir(
  window: BrowserWindow,
  dir: OsuDirectory,
): Promise<Result<number, string>> {
  await Router.dispatch(window, "changeScene", "loading");
  await Router.dispatch(window, "loadingScene::setTitle", "Importing songs from osu!");

  // Wrap client update function to update only every UPDATE_DELAY_MS
  const [update, cancelUpdate] = throttle(async (i: number, total: number, file: string) => {
    await Router.dispatch(window, "loadingScene::update", {
      current: i,
      max: total,
      hint: file,
    });
  }, UPDATE_DELAY_MS);

  const parsed =
    dir.version === "stable"
      ? await OsuParser.parseStableDatabase(dir.path, update)
      : await OsuParser.parseLazerDatabase(dir.path, update);

  // Cancel ongoing throttled update, so it does not look bad when it finishes and afterward the update overwrites
  // finished state
  cancelUpdate();

  if (parsed.isError) {
    return fail(parsed.error);
  }

  const total = parsed.value.size;
  if (total === 0) {
    return fail(
      `No songs found in folder: ${dir.path}. Please make sure this is the directory where you have all your songs saved.`,
    );
  }

  // Show finished state
  await Router.dispatch(window, "loadingScene::update", {
    max: total,
    current: total,
    hint: `Imported total of ${total} songs`,
  });

  const songs = Object.fromEntries(parsed.value);
  carryOverUserData(songs, Storage.getTable("songs").getStruct());

  Storage.setTable("songs", songs);
  Storage.getTable("settings").write("osuSongsDir", dir.path);

  // Start indexing songs
  await Router.dispatch(window, "loadingScene::setTitle", "Indexing songs");

  const [updateIndex, cancelIndexUpdate] = throttle(async (i: number, song: string) => {
    await Router.dispatch(window, "loadingScene::update", {
      current: i,
      hint: song,
      max: total,
    });
  }, UPDATE_DELAY_MS);

  setSongIndexes(indexSongs(songs, updateIndex));
  cancelIndexUpdate();

  // Persist the import right away. It is expensive to redo if the app gets killed
  await Storage.flushAll();

  // Display finished state
  await Router.dispatch(window, "loadingScene::update", {
    current: total,
    hint: "Indexed " + total + " songs",
    max: total,
  });

  return ok(total);
}

function carryOverUserData(next: Record<string, Song>, previous: Record<string, Song>): void {
  for (const id in next) {
    const old = previous[id];
    if (old === undefined) {
      continue;
    }

    const song = next[id];
    song.primaryColor ??= old.primaryColor;
    song.secondaryColor ??= old.secondaryColor;
    song.volume ??= old.volume;
  }
}

/**
 * Let user pick osu! installation in dir-select scene and import it. Import errors are shown to the user and they are
 * asked to pick again.
 *
 * Does not change scene afterward, caller is responsible for that.
 *
 * @param cancelable whether the user may leave dir-select scene without picking (current library is kept)
 * @returns true if new installation was imported, false if user canceled
 */
export async function configureOsuDir(
  window: BrowserWindow,
  cancelable: boolean,
): Promise<boolean> {
  while (true) {
    await Router.dispatch(window, "changeScene", "dir-select");
    const dir = await dirSubmit(cancelable);

    if (dir === undefined) {
      return false;
    }

    const result = await importOsuDir(window, dir);
    if (!result.isError) {
      return true;
    }

    await showError(window, result.error);
  }
}

/**
 * Run given import flow and return to main scene afterward. Only one import may run at a time
 */
export async function runImport(
  window: BrowserWindow,
  flow: (window: BrowserWindow) => Promise<unknown>,
): Promise<void> {
  if (isImporting) {
    return;
  }

  isImporting = true;
  try {
    await flow(window);
  } finally {
    isImporting = false;
    await Router.dispatch(window, "changeScene", "main");
  }
}

/**
 * Import current osu! installation again (e.g. to pick up songs added in-game)
 */
export async function reimportCurrentDir(window: BrowserWindow): Promise<void> {
  const current = Storage.getTable("settings").get("osuSongsDir");
  const dir = current.isNone ? undefined : detectOsuDir(current.value);

  if (dir === undefined) {
    await showError(
      window,
      "Current osu! folder could not be found or is no longer a valid osu! installation. Please select it again.",
    );
    await configureOsuDir(window, true);
    return;
  }

  const result = await importOsuDir(window, dir);
  if (result.isError) {
    await showError(window, result.error);
  }
}
