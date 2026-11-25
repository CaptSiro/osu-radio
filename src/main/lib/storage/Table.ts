import { none, some } from "@shared/lib/rust-types/Optional";
import { Optional } from "@shared/types/common.types";
import fs from "fs";

/** Wait this long after the last change before writing the table to disk */
const WRITE_DEBOUNCE_MS = 500;
/** Never postpone a pending write by more than this, even when changes keep coming */
const WRITE_MAX_DELAY_MS = 5_000;

/**
 * In-memory table backed by a JSON file.
 *
 * Reads are served from memory. Changes are applied to memory immediately and persisted lazily: bursts of writes
 * (window resizing, color extraction while scrolling, volume slider, ...) are coalesced into a single asynchronous
 * file write. Files are written atomically (temp file + rename) so a crash mid-write cannot corrupt the table.
 *
 * Call {@link Table.flushSync} (or {@link Storage.flushAll}) before the process exits to persist pending changes.
 */
export class Table<S extends object> {
  private readonly path: string;
  private struct: S;

  private dirty = false;
  private writing: Promise<void> | undefined = undefined;
  private debounceTimer: NodeJS.Timeout | undefined = undefined;
  private firstChangeAt = 0;

  constructor(path: string, struct: S) {
    this.path = path;
    this.struct = struct;
  }

  get<K extends keyof S>(key: K): Optional<S[K]> {
    const value = this.struct[key];
    return value === undefined ? none() : some(value);
  }

  /**
   * Returns underlying structure of this table. If you mutate it, call {@link Table.markDirty} afterward
   */
  getStruct(): S {
    return this.struct;
  }

  /**
   * Writes content to given key (row). The change is persisted to disk shortly after
   */
  write<K extends keyof S>(key: K, content: S[K]): void {
    this.struct[key] = content;
    this.markDirty();
  }

  /**
   * Remove given row. The change is persisted to disk shortly after
   */
  delete<K extends keyof S>(key: K): void {
    if (!(key in this.struct)) {
      return;
    }

    delete this.struct[key];
    this.markDirty();
  }

  /**
   * Replace whole content of the table
   */
  replace(struct: S): void {
    this.struct = struct;
    this.markDirty();
  }

  /**
   * Return path to table file
   */
  filePath(): string {
    return this.path;
  }

  /**
   * Schedule the table to be written to disk
   */
  markDirty(): void {
    const now = Date.now();
    if (!this.dirty) {
      this.dirty = true;
      this.firstChangeAt = now;
    }

    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }

    const wait = Math.max(
      0,
      Math.min(WRITE_DEBOUNCE_MS, this.firstChangeAt + WRITE_MAX_DELAY_MS - now),
    );
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.flush();
    }, wait);
  }

  /**
   * Persist pending changes asynchronously. Resolves when everything that was pending at the time of the call is on
   * disk
   */
  async flush(): Promise<void> {
    // Writes are serialized, wait for ongoing one to finish first
    while (this.writing !== undefined) {
      await this.writing;
    }

    if (!this.dirty) {
      return;
    }

    this.cancelTimer();
    this.dirty = false;
    const data = JSON.stringify(this.struct);
    const tmp = this.path + ".tmp";

    this.writing = fs.promises
      .writeFile(tmp, data, { encoding: "utf8" })
      .then(() => fs.promises.rename(tmp, this.path))
      .catch((error) => {
        console.error(`Failed to write table '${this.path}':`, error);
        // Retry on the next change / flush
        this.dirty = true;
      })
      .finally(() => {
        this.writing = undefined;
      });

    await this.writing;
  }

  /**
   * Persist pending changes synchronously. Meant to be used when the app is about to quit
   */
  flushSync(): void {
    this.cancelTimer();

    if (!this.dirty) {
      return;
    }

    this.dirty = false;
    writeFileAtomicSync(this.path, JSON.stringify(this.struct));
  }

  /**
   * Drop pending changes without writing them
   */
  discard(): void {
    this.cancelTimer();
    this.dirty = false;
  }

  private cancelTimer(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}

export function writeFileAtomicSync(file: string, data: string): void {
  // Different temp file than async flush so the two can never interleave on the same file
  const tmp = file + ".sync.tmp";
  fs.writeFileSync(tmp, data, { encoding: "utf8" });
  fs.renameSync(tmp, file);
}
