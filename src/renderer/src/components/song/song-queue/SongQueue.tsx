import { namespace } from "@renderer/App";
import InfiniteScroller from "@renderer/components/InfiniteScroller";
import Button from "@renderer/components/button/Button";
import DropdownList from "@renderer/components/dropdown-list/DropdownList";
import { Input } from "@renderer/components/input/Input";
import {
  openPlaylistPicker,
  saveQueueAsPlaylist,
} from "@renderer/components/playlist/playlist.utils";
import SongItem from "@renderer/components/song/song-item/SongItem";
import Impulse from "@renderer/lib/Impulse";
import scrollIfNeeded from "@shared/lib/tungsten/scroll-if-needed";
import { Song } from "@shared/types/common.types";
import { CheckIcon, DeleteIcon, ListPlusIcon, SaveIcon, XIcon } from "lucide-solid";
import { Component, createSignal, onCleanup, onMount, Show } from "solid-js";

const SongQueue: Component = () => {
  const [count, setCount] = createSignal(0);
  const [saving, setSaving] = createSignal(false);
  const resetListing = new Impulse();
  const group = namespace.create(true);
  let view: HTMLDivElement | undefined;

  const onSongsLoad = async () => {
    if (!view) {
      return;
    }

    const song = await window.api.request("queue::current");

    if (song.isNone) {
      return;
    }

    changeSongHighlight(song.value);
  };

  const onDrop = (s: Song) => {
    return async (before: Element | null) => {
      await window.api.request(
        "queue::place",
        s.osuFile,
        (before as HTMLElement | null)?.dataset.osuFile,
      );
    };
  };

  const changeSongHighlight = (song: Song): void => {
    if (view === undefined) {
      return;
    }

    const selected = view.querySelector<HTMLElement>(".song-item.selected");
    if (selected !== null && selected.dataset.path !== song.path) {
      selected.classList.remove("selected");
    }

    const path = song.path.replaceAll('"', '\\"').replaceAll("\\", "\\\\");
    const element = view.querySelector<HTMLElement>(`.song-item[data-path="${path}"]`);
    element?.classList.add("selected");

    if (element === null) {
      return;
    }

    const list = element.closest<HTMLElement>(".list");

    if (list === null) {
      return;
    }

    scrollIfNeeded(element, list);
  };

  onMount(() => {
    window.api.listen("queue::created", resetListing.pulse.bind(resetListing));
    window.api.listen("queue::songChanged", changeSongHighlight);
  });

  onCleanup(() => {
    window.api.removeListener("queue::created", resetListing.pulse.bind(resetListing));
    window.api.removeListener("queue::songChanged", changeSongHighlight);
  });

  return (
    <div class="flex w-full flex-col">
      <div class="flex items-center justify-between gap-2 px-5 pb-2 pt-5">
        <h2 class="text-sm font-bold">
          <span>Next songs on the queue</span>
          <span class="text-subtext"> ({count()})</span>
        </h2>
        <Button
          size="icon"
          variant="ghost"
          class="m-0"
          onClick={() => setSaving((s) => !s)}
          disabled={count() === 0}
          title="Save queue as playlist"
        >
          <SaveIcon size={18} />
        </Button>
      </div>

      <Show when={saving()}>
        <SaveQueueForm onDone={() => setSaving(false)} />
      </Show>

      <div class="flex-grow overflow-y-auto px-4">
        <InfiniteScroller
          apiKey={"query::queue"}
          apiInitKey={"query::queue::init"}
          setCount={setCount}
          reset={resetListing}
          onLoadItems={onSongsLoad}
          fallback={<div class="py-8 text-center text-subtext">No queue...</div>}
          builder={(s) => (
            <SongItem
              song={s}
              group={group}
              selectable={true}
              onSelect={() => window.api.request("queue::play", s.osuFile)}
              onDrop={onDrop(s)}
              contextMenu={<QueueContextMenuContent song={s} />}
            />
          )}
        />
      </div>
    </div>
  );
};

type SaveQueueFormProps = { onDone: () => void };
const SaveQueueForm: Component<SaveQueueFormProps> = (props) => {
  const [name, setName] = createSignal("");

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (await saveQueueAsPlaylist(name())) {
      props.onDone();
    }
  };

  return (
    <form class="flex items-center gap-1 px-5 pb-2" onSubmit={submit}>
      <Input
        placeholder="Playlist name"
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            props.onDone();
          }
        }}
        autofocus
      />
      <Button
        type="submit"
        size="square"
        variant="ghost"
        disabled={name().trim() === ""}
        title="Save"
      >
        <CheckIcon size={18} />
      </Button>
      <Button size="square" variant="ghost" onClick={() => props.onDone()} title="Cancel">
        <XIcon size={18} />
      </Button>
    </form>
  );
};

type QueueContextMenuContentProps = { song: Song };
const QueueContextMenuContent: Component<QueueContextMenuContentProps> = (props) => {
  return (
    <DropdownList class="w-52">
      <DropdownList.Item onClick={() => openPlaylistPicker(props.song)}>
        <span>Add to Playlist</span>
        <ListPlusIcon class="text-subtext" size={20} />
      </DropdownList.Item>
      <DropdownList.Item
        onClick={() => window.api.request("queue::removeSong", props.song.osuFile)}
        class="text-danger"
      >
        <span>Remove from queue</span>
        <DeleteIcon class="opacity-80" size={20} />
      </DropdownList.Item>
    </DropdownList>
  );
};

export default SongQueue;
