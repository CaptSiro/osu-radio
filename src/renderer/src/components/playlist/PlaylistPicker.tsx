import {
  addSongToPlaylist,
  closePlaylistPicker,
  createPlaylist,
  pickerSong,
  playlists,
} from "./playlist.utils";
import Button from "@renderer/components/button/Button";
import { Input } from "@renderer/components/input/Input";
import { PlaylistID, Song } from "@shared/types/common.types";
import { ListMusicIcon, PlusIcon, XIcon } from "lucide-solid";
import { Component, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

/**
 * Modal dialog for adding a song to a playlist. Mounted once in MainScene, opened via `openPlaylistPicker(song)`
 */
const PlaylistPicker: Component = () => {
  return (
    <Show when={pickerSong()} keyed>
      {(song) => (
        <Portal>
          <PlaylistPickerDialog song={song} />
        </Portal>
      )}
    </Show>
  );
};

type DialogProps = { song: Song };
const PlaylistPickerDialog: Component<DialogProps> = (props) => {
  const [name, setName] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closePlaylistPicker();
    }
  };

  onMount(() => window.addEventListener("keydown", onKeyDown));
  onCleanup(() => window.removeEventListener("keydown", onKeyDown));

  const add = async (id: PlaylistID) => {
    if (busy()) return;
    setBusy(true);
    const added = await addSongToPlaylist(id, props.song);
    setBusy(false);

    if (added) {
      closePlaylistPicker();
    }
  };

  const createAndAdd = async (e: SubmitEvent) => {
    e.preventDefault();
    if (busy()) return;
    setBusy(true);
    const id = await createPlaylist(name());
    setBusy(false);

    if (id !== undefined) {
      await add(id);
    }
  };

  return (
    <div
      class="no-drag fixed inset-0 z-50 grid place-items-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePlaylistPicker();
      }}
    >
      <div
        role="dialog"
        aria-label="Add to playlist"
        class="flex max-h-[70vh] w-[360px] flex-col gap-3 rounded-xl border border-stroke bg-thick-material p-4 shadow-2xl"
      >
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-semibold">Add to playlist</h2>
            <p class="truncate text-sm text-subtext">
              {props.song.artist} - {props.song.title}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={closePlaylistPicker} title="Close">
            <XIcon size={20} />
          </Button>
        </div>

        <div class="flex min-h-0 flex-col gap-1 overflow-y-auto">
          <For
            each={playlists()}
            fallback={<p class="py-2 text-center text-sm text-subtext">No playlists yet</p>}
          >
            {(playlist) => (
              <button
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface"
                disabled={busy()}
                onClick={() => add(playlist.id)}
              >
                <ListMusicIcon size={20} class="shrink-0 text-subtext" />
                <span class="flex-1 truncate">{playlist.name}</span>
                <span class="text-sm text-subtext">{playlist.count}</span>
              </button>
            )}
          </For>
        </div>

        <form class="flex gap-2" onSubmit={createAndAdd}>
          <Input
            placeholder="New playlist name"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            autofocus
          />
          <Button
            type="submit"
            size="square"
            variant="outlined"
            disabled={busy() || name().trim() === ""}
            title="Create playlist and add song"
          >
            <PlusIcon size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PlaylistPicker;
