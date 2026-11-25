import { Storage } from "@main/lib/storage/Storage";
import { Song, SongIndex } from "@shared/types/common.types";

export function* indexMapper(indexes: SongIndex[]): Generator<Song> {
  const songs = Storage.getTable("songs").getStruct();

  for (let i = 0; i < indexes.length; i++) {
    const song = songs[indexes[i].id];

    if (song !== undefined) {
      yield song;
    }
  }
}
