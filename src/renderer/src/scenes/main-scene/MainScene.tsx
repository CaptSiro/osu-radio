import { Sidebar } from "./Sidebar";
import {
  setAnimateSidebar,
  setSidebarWidth,
  settingsWriteSidebarWidth,
  sidebarWidth,
  useMainResizableOptions,
} from "./main.utils";
import "./styles.css";
import Button from "@renderer/components/button/Button";
import PlaylistPicker from "@renderer/components/playlist/PlaylistPicker";
import Popover from "@renderer/components/popover/Popover";
import ResizablePanel from "@renderer/components/resizable-panel/ResizablePanel";
import SongImage from "@renderer/components/song/SongImage";
import SongDetail from "@renderer/components/song/song-detail/SongDetail";
import SongQueue from "@renderer/components/song/song-queue/SongQueue";
import { song } from "@renderer/components/song/song.utils";
import { WindowsControls } from "@renderer/components/windows-control/WindowsControl";
import { Layers3Icon } from "lucide-solid";
import { Accessor, Component, createSignal, Match, onMount, Switch } from "solid-js";

const MainScene: Component = () => {
  const { maxSidebarWidth, offsetFromPanel } = useMainResizableOptions();
  const [os, setOs] = createSignal<NodeJS.Platform>();

  onMount(async () => {
    const fetchOS = async () => {
      return await window.api.request("os::platform");
    };

    setOs(await fetchOS());
  });
  return (
    <div class="flex h-full min-h-screen flex-col">
      <Switch>
        <Match when={os() === "darwin"}>
          <MacNav />
        </Match>
        <Match when={os() !== "darwin"}>
          <WindownsNav />
        </Match>
      </Switch>

      <ResizablePanel
        offsetFromPanel={offsetFromPanel()}
        min={os() === "darwin" ? 432 : 390}
        max={maxSidebarWidth()}
        value={sidebarWidth as Accessor<number>}
        onValueChange={setSidebarWidth}
        onValueStart={() => setAnimateSidebar(false)}
        onValueCommit={(width) => {
          setAnimateSidebar(true);
          settingsWriteSidebarWidth(width);
        }}
      >
        <main class="main-scene app-grid relative flex-1">
          <Sidebar />
          <div
            class="song relative flex flex-1 items-center justify-center"
            classList={{
              "m-2 rounded-3xl": os() === "darwin",
              "mt-0 m-2": os() !== "darwin",
            }}
          >
            <SongDetail />
            <Queue />
            <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-lg shadow-2xl ring-2 ring-inset ring-stroke">
              <SongImage
                src={song().bg}
                instantLoad={true}
                class="absolute inset-0 bg-cover bg-fixed bg-left-top opacity-30 blur-lg filter"
              />
            </div>
          </div>
        </main>
      </ResizablePanel>
      <div class="pointer-events-none fixed inset-0 z-[-1] h-full">
        <SongImage
          src={song().bg}
          instantLoad={true}
          class="h-full w-full bg-cover bg-fixed bg-center blur-lg filter"
        />
      </div>

      <div class="pointer-events-none fixed inset-0 z-[-1] h-full bg-black/80" />
      <PlaylistPicker />
    </div>
  );
};

const Queue: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <Popover
      placement="bottom-end"
      offset={{
        mainAxis: 8,
      }}
      onValueChange={setIsOpen}
      isOpen={isOpen}
    >
      <Popover.Anchor onClick={() => setIsOpen(true)} class="no-drag absolute right-2 top-2 z-10">
        <Button size="square" variant="outlined" class="no-drag">
          <Layers3Icon size={20} />
        </Button>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content class="flex max-h-[600px] w-[480px] p-0">
          <SongQueue />
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
};

const MacNav: Component = () => {
  return <nav class="drag fixed left-0 top-0 h-16 w-screen hover:bg-subtext" />;
};

const WindownsNav: Component = () => {
  return (
    <nav class="nav drag relative flex items-center justify-end">
      <WindowsControls />
    </nav>
  );
};

export default MainScene;
