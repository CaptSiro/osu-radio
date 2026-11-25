import { Table } from "./Table";
import { BlobMap, TableMap } from "@shared/types/common.types";
import { app } from "electron";
import fs from "fs";
import path from "path";

export class Storage {
  private static cache: Map<string, Table<any>> = new Map();

  /**
   * Get file located in default-appdata-directory/storage/[table-name].json and parse it then save to cache and return.
   * If file does not exist it is created with empty table
   * @param name
   */
  static getTable<T extends keyof TableMap>(name: T): Table<TableMap[T]> {
    const hit = this.cache.get(name);

    if (hit !== undefined) {
      return hit;
    }

    const tablePath = path.join(app.getPath("userData"), `/storage/${name}.json`);

    if (!fs.existsSync(tablePath)) {
      fs.mkdirSync(path.join(app.getPath("userData"), "/storage"), { recursive: true });
      fs.writeFileSync(tablePath, "{}");
      const empty = new Table(tablePath, {} as any);
      this.cache.set(name, empty);
      return empty;
    }

    const table = new Table(
      tablePath,
      JSON.parse(fs.readFileSync(tablePath, { encoding: "utf8" })),
    );
    this.cache.set(name, table);
    return table;
  }

  /**
   * Write whole table to file
   * @param name
   * @param contents
   */
  static setTable<T extends keyof TableMap>(name: T, contents: TableMap[T]): Table<TableMap[T]> {
    const tablePath = path.join(app.getPath("userData"), `/storage/${name}.json`);
    if (!fs.existsSync(tablePath)) {
      fs.mkdirSync(path.join(app.getPath("userData"), "/storage"), { recursive: true });
    }

    fs.writeFileSync(tablePath, JSON.stringify(contents));
    const t = new Table(tablePath, contents);

    this.cache.set(name, t);
    return t;
  }

  /**
   * Delete whole table
   * @param name
   */
  static removeTable<T extends keyof TableMap>(name: T): void {
    this.cache.delete(name);
    fs.unlinkSync(path.join(app.getPath("userData"), `/storage/${name}.json`));
  }

  /**
   * Get file with binary data. If the file does not exist an empty file is created and read. Resulting in empty buffer
   * being returned
   * @param name
   */
  static getBlob<T extends keyof BlobMap>(name: T): Buffer {
    const blobPath = path.join(app.getPath("userData"), "/storage/" + name);

    if (!fs.existsSync(blobPath)) {
      fs.mkdirSync(path.join(app.getPath("userData"), "/storage"), { recursive: true });
      fs.writeFileSync(blobPath, "");
    }

    return fs.readFileSync(blobPath);
  }

  /**
   * Write Buffer to file
   * @param name
   * @param blob
   */
  static setBlob<T extends keyof BlobMap>(name: T, blob: Buffer): void {
    const blobPath = path.join(app.getPath("userData"), "/storage/" + name);

    if (!fs.existsSync(blobPath)) {
      fs.mkdirSync(path.join(app.getPath("userData"), "/storage"), { recursive: true });
    }

    fs.writeFileSync(blobPath, blob);
  }
}
