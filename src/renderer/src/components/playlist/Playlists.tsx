import {
  createPlaylist,
  deletePlaylist,
  openedPlaylist,
  playlists,
  renamePlaylist,
  setOpenedPlaylist,
} from "./playlist.utils";
import Button from "@renderer/components/button/Button";
import { Input } from "@renderer/components/input/Input";
import SongList from "@renderer/components/song/song-list/SongList";
import { PlaylistID, PlaylistInfo } from "@shared/types/common.types";
import {
  ArrowLeftIcon,
  CheckIcon,
  ListMusicIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-solid";
import { Component, createMemo, createSignal, For, Show } from "solid-js";

/**
 * Content of the Playlists sidebar tab. Shows either list of playlists or songs of the opened playlist
 */
const Playlists: Component = () => {
  return (
    <Show when={openedPlaylist()} keyed fallback={<PlaylistOverview />}>
      {(id) => <PlaylistDetail id={id} />}
    </Show>
  );
};

type PlaylistDetailProps = { id: PlaylistID };
const PlaylistDetail: Component<PlaylistDetailProps> = (props) => {
  const playlist = createMemo(
    (): PlaylistInfo =>
      playlists().find((p) => p.id === props.id) ?? {
        id: props.id,
        name: "",
        count: 0,
        createdAt: 0,
      },
  );

  return (
    <>
      <div class="flex items-center gap-2 px-5 pb-1 pt-3">
        <Button
          size="square"
          variant="outlined"
          onClick={() => setOpenedPlaylist(undefined)}
          title="Back to playlists"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h2 class="flex-1 truncate text-lg font-semibold">{playlist().name}</h2>
        <span class="text-sm text-subtext">
          {playlist().count} {playlist().count === 1 ? "song" : "songs"}
        </span>
      </div>
      <SongList playlist={props.id} />
    </>
  );
};

const PlaylistOverview: Component = () => {
  const [name, setName] = createSignal("");

  const create = async (e: SubmitEvent) => {
    e.preventDefault();
    const id = await createPlaylist(name());

    if (id !== undefined) {
      setName("");
    }
  };

  return (
    <>
      <form class="flex gap-2 px-5 pb-2 pt-3" onSubmit={create}>
        <Input
          placeholder="New playlist name"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
        />
        <Button
          type="submit"
          size="square"
          variant="outlined"
          disabled={name().trim() === ""}
          title="Create playlist"
        >
          <PlusIcon size={20} />
        </Button>
      </form>

      <div class="flex flex-grow flex-col gap-1 overflow-y-auto p-5 py-0">
        <For
          each={playlists()}
          fallback={
            <div class="py-8 text-center text-subtext">
              <p class="text-lg uppercase">No playlists</p>
              <p class="text-sm">Create one above, or use "Add to Playlist" on any song.</p>
            </div>
          }
        >
          {(playlist) => <PlaylistRow playlist={playlist} />}
        </For>
      </div>
    </>
  );
};

type PlaylistRowProps = { playlist: PlaylistInfo };
const PlaylistRow: Component<PlaylistRowProps> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [confirmDelete, setConfirmDelete] = createSignal(false);
  const [draft, setDraft] = createSignal("");

  const startEditing = () => {
    setDraft(props.playlist.name);
    setConfirmDelete(false);
    setEditing(true);
  };

  const submitRename = async (e: SubmitEvent) => {
    e.preventDefault();
    if (draft().trim() === props.playlist.name) {
      setEditing(false);
      return;
    }

    if (await renamePlaylist(props.playlist.id, draft())) {
      setEditing(false);
    }
  };

  return (
    <div class="group flex min-h-[56px] items-center gap-2 rounded-lg border border-stroke bg-black/40 px-3 transition-colors hover:bg-surface">
      <Show
        when={editing()}
        fallback={
          <>
            <button
              class="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left"
              onClick={() => setOpenedPlaylist(props.playlist.id)}
            >
              <ListMusicIcon size={22} class="shrink-0 text-subtext" />
              <span class="flex-1 truncate text-lg font-semibold">{props.playlist.name}</span>
              <span class="text-sm text-subtext">{props.playlist.count}</span>
            </button>

            <Show
              when={confirmDelete()}
              fallback={
                <div class="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <Button size="square" variant="ghost" onClick={startEditing} title="Rename">
                    <PencilIcon size={18} />
                  </Button>
                  <Button
                    size="square"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete"
                  >
                    <Trash2Icon size={18} />
                  </Button>
                </div>
              }
            >
              <div class="flex items-center gap-1">
                <Button
                  variant="danger-outlined"
                  onClick={() => deletePlaylist(props.playlist.id)}
                  title="Delete playlist permanently"
                >
                  Delete
                </Button>
                <Button
                  size="square"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  title="Cancel"
                >
                  <XIcon size={18} />
                </Button>
              </div>
            </Show>
          </>
        }
      >
        <form class="flex flex-1 items-center gap-1 py-2" onSubmit={submitRename}>
          <Input
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
            }}
            autofocus
          />
          <Button type="submit" size="square" variant="ghost" title="Save">
            <CheckIcon size={18} />
          </Button>
          <Button size="square" variant="ghost" onClick={() => setEditing(false)} title="Cancel">
            <XIcon size={18} />
          </Button>
        </form>
      </Show>
    </div>
  );
};

export default Playlists;
