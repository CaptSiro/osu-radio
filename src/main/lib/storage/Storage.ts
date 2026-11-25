import { Table, writeFileAtomicSync } from "./Table";
import { TableMap } from "@shared/types/common.types";
import { app } from "electron";
import fs from "fs";
import path from "path";

/**
 * Bump whenever the shape of persisted song data changes. On mismatch all imported song data is discarded and the user
 * is asked to import their osu! directory again. User data (settings, playlists) is kept.
 */
const STORAGE_VERSION = 2;

/** Tables that are derived from osu! files and can always be recreated by importing again */
const SONG_DATA_TABLES: (keyof TableMap)[] = ["songs"];

/** Files written by older versions that are no longer used */
const LEGACY_FILES = ["audio.json", "images.json", "system.json"];

const VERSION_FILE = "version";

export class Storage {
  private static cache: Map<keyof TableMap, Table<any>> = new Map();
  private static dir: string | undefined = undefined;

  /**
   * Directory holding all table files. Created and migrated on first access
   */
  private static storageDir(): string {
    if (this.dir !== undefined) {
      return this.dir;
    }

    const dir = path.join(app.getPath("userData"), "storage");
    fs.mkdirSync(dir, { recursive: true });
    this.dir = dir;
    this.migrate(dir);

    return dir;
  }

  private static migrate(dir: string): void {
    const versionPath = path.join(dir, VERSION_FILE);
    let version = 0;

    try {
      version = Number(fs.readFileSync(versionPath, { encoding: "utf8" }).trim()) || 0;
    } catch {
      // Missing version file -> fresh install or storage written by version 1
    }

    if (version === STORAGE_VERSION) {
      return;
    }

    for (const name of SONG_DATA_TABLES) {
      fs.rmSync(this.tablePath(dir, name), { force: true });
    }

    for (const file of LEGACY_FILES) {
      fs.rmSync(path.join(dir, file), { force: true });
    }

    // Force re-import of songs
    const settings = this.getTable("settings");
    settings.delete("osuSongsDir");
    settings.flushSync();

    writeFileAtomicSync(versionPath, String(STORAGE_VERSION));
  }

  private static tablePath(dir: string, name: keyof TableMap): string {
    return path.join(dir, `${name}.json`);
  }

  /**
   * Load table from `userData/storage/[table-name].json` (cached after first load). If the file does not exist or is
   * corrupted, an empty table is returned
   */
  static getTable<T extends keyof TableMap>(name: T): Table<TableMap[T]> {
    const hit = this.cache.get(name);
    if (hit !== undefined) {
      return hit;
    }

    const tablePath = this.tablePath(this.storageDir(), name);
    const table = new Table<TableMap[T]>(tablePath, this.readTableFile(tablePath));
    this.cache.set(name, table);
    return table;
  }

  private static readTableFile(tablePath: string): any {
    let contents: string;
    try {
      contents = fs.readFileSync(tablePath, { encoding: "utf8" });
    } catch {
      return {};
    }

    try {
      const parsed = JSON.parse(contents);
      if (parsed !== null && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      // Fall through
    }

    // Keep the broken file around for inspection instead of silently overwriting it
    const backup = `${tablePath}.corrupt-${Date.now()}`;
    console.error(`Table file '${tablePath}' is corrupted. Moving it to '${backup}'.`);
    fs.renameSync(tablePath, backup);
    return {};
  }

  /**
   * Replace whole table contents. Persisted to disk shortly after
   */
  static setTable<T extends keyof TableMap>(name: T, contents: TableMap[T]): Table<TableMap[T]> {
    const table = this.getTable(name);
    table.replace(contents);
    return table;
  }

  /**
   * Delete whole table
   */
  static removeTable<T extends keyof TableMap>(name: T): void {
    const tablePath = this.tablePath(this.storageDir(), name);
    this.cache.get(name)?.discard();
    this.cache.delete(name);
    fs.rmSync(tablePath, { force: true });
  }

  /**
   * Persist all pending changes asynchronously
   */
  static async flushAll(): Promise<void> {
    await Promise.all(Array.from(this.cache.values(), (table) => table.flush()));
  }

  /**
   * Persist all pending changes synchronously. Call before the process exits
   */
  static flushAllSync(): void {
    for (const table of this.cache.values()) {
      try {
        table.flushSync();
      } catch (error) {
        console.error(`Failed to flush table '${table.filePath()}':`, error);
      }
    }
  }
}
