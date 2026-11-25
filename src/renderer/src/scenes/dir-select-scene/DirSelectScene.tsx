import "../main-scene/styles.css";
import osuLazerLogo from "@renderer/assets/osu-lazer-logo.png";
import osuStableLogo from "@renderer/assets/osu-stable-logo.png";
import Button from "@renderer/components/button/Button";
import { WindowsControls } from "@renderer/components/windows-control/WindowsControl";
import { OsuDirectory } from "@shared/types/router.types";
import { Accessor, Component, createSignal, For, onMount, Setter, Show } from "solid-js";

export default function DirSelectScene() {
  const [dirs, setDirs] = createSignal<OsuDirectory[]>([]);
  const [selectedDir, setSelectedDir] = createSignal<OsuDirectory>({ version: "none", path: "" });
  // Opened from settings: user may go back without changing anything
  const [isCancelable, setIsCancelable] = createSignal(false);
  const [currentPath, setCurrentPath] = createSignal<string>();

  onMount(async () => {
    const [cancelable, current] = await Promise.all([
      window.api.request("dir::isCancelable"),
      window.api.request("dir::current"),
    ]);

    setIsCancelable(cancelable);
    if (cancelable && !current.isNone) {
      setCurrentPath(current.value.path);
    }

    await autodetectDir();
  });

  const autodetectDir = async () => {
    const autoGetDir = await window.api.request("dir::autoGetOsuDirs");
    if (autoGetDir.isNone) {
      return;
    }

    setDirs(autoGetDir.value);
  };

  const cancel = async () => {
    await window.api.request("dir::cancel");
  };

  const selectDir = async () => {
    const opt = await window.api.request("dir::select");
    if (opt.isNone) {
      return;
    }

    setDirs((dirs) => [...dirs, opt.value]);
    setSelectedDir(opt.value);
  };

  const submitDir = async () => {
    if (selectedDir().version === "none") {
      return;
    }

    await window.api.request("dir::submit", selectedDir());
  };

  const [os, setOs] = createSignal<NodeJS.Platform>();

  onMount(async () => {
    const fetchOS = async () => {
      return await window.api.request("os::platform");
    };

    setOs(await fetchOS());
  });

  const GRADIENT = `radial-gradient(at 1% 75%, hsla(228,61%,67%,0.1) 0px, transparent 50%),
    radial-gradient(at 20% 56%, hsla(87,75%,61%,0.1) 0px, transparent 50%),
    radial-gradient(at 35% 34%, hsla(50,72%,67%,0.1) 0px, transparent 50%),
    radial-gradient(at 50% 18%, hsla(296,74%,62%,0.1) 0px, transparent 50%),
    radial-gradient(at 92% 14%, hsla(54,93%,75%,0.1) 0px, transparent 50%),
    radial-gradient(at 9% 83%, hsla(226,80%,64%,0.1) 0px, transparent 50%),
    radial-gradient(at 1% 96%, hsla(221,81%,65%,0.1) 0px, transparent 50%)`;

  return (
    <div class="relative grid h-screen place-items-center p-8" style={{ background: GRADIENT }}>
      <div class="drag absolute left-0 top-0 flex h-10 w-full justify-end">
        {os() !== "darwin" && <WindowsControls />}
      </div>
      <div class="flex h-full max-h-[720px] w-full max-w-[860px] flex-col justify-between gap-12 overflow-y-auto rounded-2xl border border-stroke/10 bg-regular-material p-8 shadow-2xl">
        <h1 class="pt-12 text-center text-2xl">
          {isCancelable() ? "Change osu! installation" : "Welcome to osu! radio"}
        </h1>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-md font-bold text-text">Select an osu! installation:</label>
            <Show when={dirs().length > 0} fallback={<p>No directories found</p>}>
              <For each={dirs()}>
                {(dir) => (
                  <InstallationCard
                    directory={dir}
                    isCurrent={dir.path === currentPath()}
                    selectedDir={selectedDir}
                    setSelectedDir={setSelectedDir}
                  />
                )}
              </For>
            </Show>
            <div class="flex items-baseline justify-between pt-2">
              <Button size="medium" variant="secondary" onClick={selectDir}>
                Select a different installation
              </Button>
              <p class="text-sm text-subtext">You can always change this in settings.</p>
            </div>
          </div>
        </div>

        <div class="flex items-end justify-end gap-2">
          <Show when={isCancelable()}>
            <Button size="large" variant="outlined" onClick={cancel}>
              <span>Cancel</span>
            </Button>
          </Show>
          <Button
            size="large"
            disabled={selectedDir().version === "none" ? true : false}
            onClick={submitDir}
          >
            <span>Submit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

type InstallationCardProps = {
  directory: OsuDirectory;
  isCurrent?: boolean;
  selectedDir: Accessor<OsuDirectory>;
  setSelectedDir: Setter<OsuDirectory>;
};

const InstallationCard: Component<InstallationCardProps> = (props) => {
  return (
    <div
      class={`flex h-[72px] w-full cursor-pointer select-none items-center rounded-xl border border-white/5 p-3 ${props.selectedDir() === props.directory ? "bg-surface" : "bg-regular-material"}`}
      onClick={() => props.setSelectedDir(props.directory)}
    >
      <img
        src={props.directory.version === "stable" ? osuStableLogo : osuLazerLogo}
        class="h-[52px] w-[52px]"
        alt=""
      />
      <div class="flex flex-col gap-1 pl-4">
        <p class="font-bold">{props.directory.path}</p>
        <div class="flex items-center gap-3">
          <div
            class="flex h-5 w-20 items-center justify-center rounded-full text-xs font-bold"
            classList={{
              "bg-pink-400": props.directory.version === "stable",
              "bg-teal-400": props.directory.version === "lazer",
            }}
          >
            {props.directory.version.toUpperCase()}
          </div>
          <Show when={props.isCurrent}>
            <span class="text-xs text-subtext">Current</span>
          </Show>
        </div>
      </div>
    </div>
  );
};
