import { averageBPM, msToBPM } from "./average-bpm";
import { assertNever } from "@shared/lib/tungsten/assertNever";
import { Order, OrderOptions, Song } from "@shared/types/common.types";

const collator = new Intl.Collator();

type Keyed = { song: Song; key: string | number };

/**
 * Sort key of a song. Computed once per song instead of once per comparison (date parsing and BPM averaging are
 * expensive and sort does O(n log n) comparisons)
 */
function sortKey(option: OrderOptions, song: Song): string | number {
  switch (option) {
    case "dateAdded":
      return new Date(song.dateAdded).getTime();
    case "title":
    case "artist":
    case "creator":
      return song[option];
    case "bpm":
      return msToBPM(averageBPM(song.bpm, song.duration * 1_000));
    case "duration":
      return song.duration;
    default:
      assertNever(option);
  }

  return 0;
}

/**
 * Missing values (empty string, NaN, Infinity) are always placed at the end regardless of direction
 */
function compareKeys(a: string | number, b: string | number, direction: number): number {
  if (typeof a === "string" && typeof b === "string") {
    if (a === "") return b === "" ? 0 : 1;
    if (b === "") return -1;
    return collator.compare(a, b) * direction;
  }

  const aOk = Number.isFinite(a);
  const bOk = Number.isFinite(b);
  if (!aOk) return bOk ? 1 : 0;
  if (!bOk) return -1;
  return ((a as number) - (b as number)) * direction;
}

/**
 * Sort songs in place by given ordering
 */
export function sortSongs(songs: Song[], ordering: Order): void {
  const { option } = ordering;
  let direction = ordering.direction === "asc" ? 1 : -1;

  // Kept from previous behaviour: "asc" on date added means newest first
  if (option === "dateAdded") {
    direction = -direction;
  }

  const keyed: Keyed[] = songs.map((song) => ({ song, key: sortKey(option, song) }));
  keyed.sort((a, b) => compareKeys(a.key, b.key, direction));

  for (let i = 0; i < keyed.length; i++) {
    songs[i] = keyed[i].song;
  }
}
