import SongList from "../../components/song/song-list/SongList";
import { Component, For, JSXElement, Match, Show, Switch } from "solid-js";
import Fa from "solid-fa";
import { faList } from "@fortawesome/free-solid-svg-icons";
import SongDetail from "../../components/song/song-detail/SongDetail";
import SongImage from "@renderer/components/song/SongImage";
import { mainActiveTab, setMainActiveTab, Tab, TABS } from "./main.utils";
import IconButton from "@renderer/components/icon-button/IconButton";
import SongQueue from "@renderer/components/song/song-queue/SongQueue";
import Settings from "@renderer/components/settings/Settings";
import { song } from "@renderer/components/song/song.utils";
import {
  songQueueModalOpen,
  toggleSongQueueModalOpen
} from "@renderer/components/song/song-queue/song-queue.utils";
import "./styles.css";

const MainScene: Component = () => {
  return (
    <div class="default-layout">
      <Nav />
      <main class="default-layout__main">
        <TabContent />
        <div class="default-layout__song-detail">
          <SongDetail />
        </div>

        <QueueModal />
      </main>

      <div class="default-layout__bg-image">
        <SongImage src={song().bg} instantLoad={true} />
      </div>
    </div>
  );
};

const Nav: Component = () => {
  return (
    <nav class="nav">
      <For each={Object.values(TABS)}>
        {({ label, ...rest }) => <NavItem {...rest}>{label}</NavItem>}
      </For>

      <div class="nav__queue">
        <IconButton data-active={songQueueModalOpen()} onClick={toggleSongQueueModalOpen}>
          <Fa icon={faList} class="nav__queue-icon" />
        </IconButton>
      </div>
    </nav>
  );
};

type NavItemProps = Pick<Tab, "value" | "icon"> & {
  children: JSXElement;
};
const NavItem: Component<NavItemProps> = ({ children, value, icon }) => {
  return (
    <button
      class="nav-item"
      data-selected={mainActiveTab() === value}
      onclick={(e) => {
        mainActiveTab() === value
          ? setMainActiveTab(null) // If the active tab is clicked again hide the sidebar
          : setMainActiveTab(value);

        e.currentTarget.blur(); // Reset the active state on the button
      }}
    >
      <Fa class="nav-item__icon" icon={icon} />
      <span class="nav-item__text">{children}</span>
    </button>
  );
};

const TabContent: Component = () => {
  return (
    <Show when={mainActiveTab() !== null}>
      <div className="tab-content">
        {/* fallback should never kick in */}
        <Switch fallback={<div>An error occurred</div>}>
          <Match when={mainActiveTab() === TABS.SONGS.value}>
            <SongList isAllSongs={true} />
          </Match>
          <Match when={mainActiveTab() === TABS.SETTINGS.value}>
            <Settings />
          </Match>
        </Switch>
      </div>
    </Show>
  );
};

const QueueModal: Component = () => {
  return (
    <Show when={songQueueModalOpen()}>
      <div class="queue-modal">
        <SongQueue />
      </div>
    </Show>
  );
};

export default MainScene;
