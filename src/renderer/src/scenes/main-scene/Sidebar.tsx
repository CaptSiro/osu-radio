import {
  animateSidebar,
  NAV_ITEMS,
  setSidebarActiveTab,
  setSidebarExpanded,
  SIDEBAR_PAGES,
  sidebarActiveTab,
  sidebarExpanded,
} from "./main.utils";
import Button from "@renderer/components/button/Button";
import Playlists from "@renderer/components/playlist/Playlists";
import ResizablePanel, {
  useResizablePanel,
} from "@renderer/components/resizable-panel/ResizablePanel";
import Settings from "@renderer/components/settings/Settings";
import SongList from "@renderer/components/song/song-list/SongList";
import Tabs from "@renderer/components/tabs/Tabs";
import { cn } from "@renderer/lib/css.utils";
import { os } from "@renderer/lib/os";
import { SettingsIcon, SidebarIcon } from "lucide-solid";
import { Component, createMemo, For, Show } from "solid-js";

function toPx(value: number) {
  return `${value}px`;
}

export const Sidebar: Component = () => {
  const state = useResizablePanel();

  const toggleSidebarShow = () => {
    setSidebarExpanded((a) => !a);
  };

  return (
    <div
      class="sidebar transition-base absolute z-40 h-full border-e-2 border-r-stroke bg-black/80 shadow-2xl backdrop-blur-md transition-colors lg:relative lg:border-e-0 lg:bg-transparent lg:shadow-none"
      style={{
        "transition-property": animateSidebar() ? "width" : "none",
        width: toPx(sidebarExpanded() ? state.value() : 0),
      }}
    >
      <div
        class="absolute bottom-0 right-0 flex h-full flex-col gap-2"
        style={{
          "min-width": toPx(state.value()),
        }}
      >
        <Button
          size="square"
          variant="outlined"
          onClick={toggleSidebarShow}
          class="no-drag fixed z-10"
          classList={{
            // Windows/Linux - Offset for the nav on the top
            "top-[8px] left-[16px]": os() !== "darwin",

            // Mac - Offset for the traffic lights on the left
            "top-[16px] left-[86px]": os() === "darwin",
          }}
        >
          <SidebarIcon size={20} />
        </Button>

        <Tabs value={sidebarActiveTab} onValueChange={setSidebarActiveTab}>
          <SidebarTabs />
          <SidebarContent />
        </Tabs>
      </div>

      <Show when={sidebarExpanded()}>
        <ResizablePanel.DragHandler
          class={cn(
            "absolute -right-4 lg:-right-6 lg:pb-4",
            os() === "darwin" ? "lg:pt-4" : "lg:pt-2",
          )}
        />
      </Show>
    </div>
  );
};

const SidebarTabs: Component = () => {
  const configButtonVariant = createMemo(() => {
    return sidebarActiveTab() === SIDEBAR_PAGES.SETTINGS.value ? "secondary" : "outlined";
  });

  return (
    <div
      class="no-drag ml-9 mt-2 flex items-center pl-4 pr-5"
      classList={{
        // Mac - Offset for the traffic lights on the left
        "pl-[86px] pt-2": os() === "darwin",
      }}
    >
      <Tabs.List class="ml-3">
        <For each={NAV_ITEMS}>
          {({ label, value, Icon }) => (
            <Tabs.Trigger value={value} class="app-no-drag">
              <Icon size={20} />
              <span>{label}</span>
            </Tabs.Trigger>
          )}
        </For>

        <Tabs.Indicator />
      </Tabs.List>

      <Button
        onClick={() => setSidebarActiveTab(SIDEBAR_PAGES.SETTINGS.value)}
        class="ml-auto"
        size="square"
        variant={configButtonVariant()}
      >
        <SettingsIcon size={20} />
      </Button>
    </div>
  );
};

const SidebarContent: Component = () => {
  return (
    <>
      <Tabs.Content value={SIDEBAR_PAGES.SONGS.value}>
        <SongList isAllSongs={true} />
      </Tabs.Content>
      <Tabs.Content value={SIDEBAR_PAGES.PLAYLISTS.value}>
        <Playlists />
      </Tabs.Content>
      <Tabs.Content value={SIDEBAR_PAGES.SETTINGS.value}>
        <Settings />
      </Tabs.Content>
    </>
  );
};
