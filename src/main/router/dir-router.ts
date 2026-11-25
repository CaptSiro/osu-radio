import { Router } from "@main/lib/route-pass/Router";
import { Storage } from "@main/lib/storage/Storage";
import { none, some } from "@shared/lib/rust-types/Optional";
import { OsuDirectory } from "@shared/types/router.types";
import { dialog } from "electron";
import fs from "fs";
import path from "path";

/**
 * Detect which osu! version is installed in given folder
 * @returns undefined if the folder is not an osu! installation
 */
export function detectOsuDir(p: string): OsuDirectory | undefined {
  if (fs.existsSync(path.join(p, "osu!.db"))) {
    return { version: "stable", path: p };
  }

  if (fs.existsSync(path.join(p, "client.realm"))) {
    return { version: "lazer", path: p };
  }

  return undefined;
}

Router.respond("dir::select", () => {
  const result = dialog.showOpenDialogSync({
    title: "Select your osu! folder",
    properties: ["openDirectory"],
  });

  if (result === undefined) {
    return none();
  }

  const dir = detectOsuDir(result[0]);
  return dir === undefined ? none() : some(dir);
});

function getStoragePath(iniPath: string) {
  return fs.readFileSync(iniPath, "utf-8").split("=")[1].trim();
}

function getOsuDirectoriesByOS(platform: string): OsuDirectory[] {
  const dirs: OsuDirectory[] = [];

  if (platform === "win32") {
    // Windows
    if (
      process.env.LOCALAPPDATA !== undefined &&
      fs.existsSync(path.join(process.env.LOCALAPPDATA, "osu!"))
    ) {
      dirs.push({ version: "stable", path: path.join(process.env.LOCALAPPDATA, "osu!") });
    }

    if (process.env.APPDATA != undefined && fs.existsSync(path.join(process.env.APPDATA, "osu"))) {
      if (fs.existsSync(path.join(process.env.APPDATA, "osu", "storage.ini"))) {
        const p = getStoragePath(path.join(process.env.APPDATA, "osu", "storage.ini"));
        dirs.push({ version: "lazer", path: p });
      } else if (fs.existsSync(path.join(process.env.APPDATA, "osu", "client.realm"))) {
        dirs.push({ version: "lazer", path: path.join(process.env.APPDATA, "osu") });
      }
    }
  } else if (platform === "linux") {
    // Linux
    const homePath = process.env.XDG_DATA_HOME ?? `${process.env.HOME}/.local/share`;

    if (homePath != undefined && fs.existsSync(path.join(homePath, "osu-wine", "osu!"))) {
      dirs.push({
        version: "stable",
        path: path.join(homePath, "osu-wine", "osu!"),
      });
    }

    if (homePath != undefined && fs.existsSync(path.join(homePath, "osu"))) {
      if (fs.existsSync(path.join(homePath, "osu", "storage.ini"))) {
        const p = getStoragePath(path.join(homePath, "osu", "storage.ini"));
        dirs.push({ version: "lazer", path: p });
      } else if (fs.existsSync(path.join(homePath, "osu", "client.realm"))) {
        dirs.push({ version: "lazer", path: path.join(homePath, "osu") });
      }
    }
  } else if (platform === "darwin" && process.env.HOME) {
    // macOS
    const macOsuPath = path.join(process.env.HOME, "Library", "Application Support", "osu");

    if (fs.existsSync(path.join(macOsuPath, "storage.ini"))) {
      const p = getStoragePath(path.join(macOsuPath, "storage.ini"));
      dirs.push({ version: "lazer", path: p });
    } else if (fs.existsSync(path.join(macOsuPath, "client.realm"))) {
      dirs.push({ version: "lazer", path: macOsuPath });
    }
  }

  return dirs;
}

Router.respond("dir::autoGetOsuDirs", () => {
  const dirs = getOsuDirectoriesByOS(process.platform);

  if (dirs.length > 0) {
    return some(dirs);
  } else {
    return none();
  }
});

type DirSubmitResolve = (value: OsuDirectory | undefined) => void;

let pendingDirRequest: DirSubmitResolve | undefined = undefined;
let isPendingCancelable = false;

function resolvePending(dir: OsuDirectory | undefined): void {
  const resolve = pendingDirRequest;
  pendingDirRequest = undefined;
  isPendingCancelable = false;
  resolve?.(dir);
}

Router.respond("dir::submit", (_evt, dir: OsuDirectory) => {
  resolvePending(dir);
});

Router.respond("dir::cancel", () => {
  if (isPendingCancelable) {
    resolvePending(undefined);
  }
});

Router.respond("dir::isCancelable", () => {
  return isPendingCancelable;
});

Router.respond("dir::current", () => {
  const current = Storage.getTable("settings").get("osuSongsDir");
  if (current.isNone) {
    return none();
  }

  const dir = detectOsuDir(current.value);
  return dir === undefined ? none() : some(dir);
});

/**
 * Wait for the user to pick osu! installation in dir-select scene
 * @param cancelable whether the user may cancel the selection
 * @returns selected installation or undefined when canceled
 */
export function dirSubmit(cancelable = false): Promise<OsuDirectory | undefined> {
  return new Promise((resolve) => {
    pendingDirRequest = resolve;
    isPendingCancelable = cancelable;
  });
}
