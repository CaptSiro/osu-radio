import Button from "../button/Button";
import Select from "@renderer/components/select/Select";
import { changeAudioDevice } from "@renderer/components/song/song.utils";
import { cn } from "@renderer/lib/css.utils";
import { OsuDirectory } from "@shared/types/router.types";
import { GlobeIcon, LucideIcon, Volume2Icon, HardDrive } from "lucide-solid";
import { Component, createEffect, createSignal, For, JSX, onMount } from "solid-js";

const Settings: Component = () => {
  return (
    <div class="flex flex-col gap-10 px-5 py-8">
      <SettingsSection title="General" Icon={GlobeIcon}>
        Empty
      </SettingsSection>
      <SettingsSection title="Audio" Icon={Volume2Icon}>
        <AudioDeviceSetting />
      </SettingsSection>
      <SettingsSection title="Storage" Icon={HardDrive}>
        <OsuDirSetting />
        {/*
          Clicking this when running in dev mode, the app will not restart correctly.
          You will need to manually close the app and start it again.
        */}
        {
          //TODO: Add a confirmation dialog before deleting song data
        }
        <Button
          variant={"danger-outlined"}
          size="large"
          onClick={() => {
            window.api.request("settings::DeleteSongData");
            window.api.request("app::restart");
          }}
        >
          Delete Song Data
        </Button>
      </SettingsSection>
    </div>
  );
};

const OsuDirSetting: Component = () => {
  const [dir, setDir] = createSignal<OsuDirectory>();

  onMount(async () => {
    const current = await window.api.request("dir::current");
    if (!current.isNone) {
      setDir(current.value);
    }
  });

  return (
    <Setting name="osu-dir" label="osu! installation">
      <p id="osu-dir" class="break-all text-sm text-subtext">
        {dir() !== undefined ? `${dir()!.path} (${dir()!.version})` : "No installation found"}
      </p>
      <div class="flex flex-wrap gap-2">
        <Button
          variant="outlined"
          onClick={() => window.api.request("settings::reimportSongs")}
          title="Import songs from current osu! installation again, e.g. after adding new songs in-game"
        >
          Re-import songs
        </Button>
        <Button variant="outlined" onClick={() => window.api.request("settings::changeOsuDir")}>
          Change osu! installation
        </Button>
      </div>
    </Setting>
  );
};

type SettingsSectionProps = JSX.IntrinsicElements["div"] & {
  title: string;
  Icon: LucideIcon;
};

const SettingsSection: Component<SettingsSectionProps> = (props) => {
  return (
    <div class={cn("flex flex-col gap-6", props.class)}>
      <div class="flex items-center gap-3">
        <props.Icon class="text-text opacity-70" size={16} />
        <h3 class="text-base text-text">{props.title}</h3>
      </div>
      {props.children}
    </div>
  );
};

type SettingProps = JSX.IntrinsicElements["div"] & {
  label: string;
  name: string;
};

const Setting: Component<SettingProps> = (props) => {
  return (
    <div class={cn("flex flex-col gap-2.5", props.class)}>
      <label class="text-sm font-semibold text-text" for={props.name}>
        {props.label}
      </label>
      {props.children}
    </div>
  );
};

const AudioDeviceSetting: Component = () => {
  const [isPopoverOpen, setIsPopoverOpen] = createSignal(false);
  const [selectedAudioDevice, setSelectedAudioDevice] = createSignal("");
  const [audioDevices, setAudioDevices] = createSignal(new Map<string, () => any>());

  const setAudioDevicesMap = () => {
    const audioMap = new Map<string, () => any>();
    let currentDeviceId = "default";
    window.api.request("settings::get", "audioDeviceId").then((v) => {
      if (v.isNone) return;
      currentDeviceId = v.value;
    });

    navigator.mediaDevices.enumerateDevices().then((r) => {
      for (const device of r) {
        if (device.kind === "audiooutput") {
          if (currentDeviceId == device.deviceId) setSelectedAudioDevice(device.label);
          audioMap.set(device.label, () => changeAudioDevice(device.deviceId));
        }
      }
      setAudioDevices(audioMap);
    });
  };

  onMount(() => {
    createEffect(setAudioDevicesMap);
  });

  const handleValueChange = (newSelectedOption: string) => {
    setSelectedAudioDevice(newSelectedOption);
    audioDevices().get(newSelectedOption)?.();
  };

  return (
    <Setting name="audio-device" label="Output audio device">
      <Select isOpen={isPopoverOpen} onValueChange={setIsPopoverOpen}>
        <Select.Trigger variant="outlined">
          {selectedAudioDevice() || "No device selected"}
        </Select.Trigger>

        <Select.Content value={selectedAudioDevice} onValueChange={handleValueChange}>
          <For each={Array.from(audioDevices().keys())}>
            {(audioDevice) => (
              <Select.Option
                onSelectedByClick={() => {
                  setIsPopoverOpen(false);
                }}
                value={audioDevice}
              >
                {audioDevice}
              </Select.Option>
            )}
          </For>
        </Select.Content>
      </Select>
    </Setting>
  );
};

export default Settings;
