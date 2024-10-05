import { faCog, faMusic, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { createSignal } from "solid-js";

export type Tab = {
  label: string;
  value: string;
  icon: IconDefinition;
};

export const TABS = {
  SONGS: {
    label: "Songs",
    value: "songs",
    icon: faMusic
  },
  SETTINGS: {
    label: "Settings",
    value: "settings",
    icon: faCog
  }
} satisfies Record<string, Tab>;

const [mainActiveTab, setMainActiveTab] = createSignal<string|null>(TABS.SONGS.value);
export { mainActiveTab, setMainActiveTab };
