import {
  isPlaying,
  next,
  previous,
  togglePlay,
  song,
  setVolume,
  volume,
  setSpeed,
  speed,
  handleMuteSong,
} from "../song.utils";
import Button from "@renderer/components/button/Button";
import { openPlaylistPicker } from "@renderer/components/playlist/playlist.utils";
import Popover from "@renderer/components/popover/Popover";
import Slider from "@renderer/components/slider/Slider";
import { isSongUndefined } from "@renderer/lib/song";
import {
  CirclePlusIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-solid";
import { Component, createMemo, createSignal, Match, Show, Switch, For } from "solid-js";
import { ParentComponent } from "solid-js";
import { Portal } from "solid-js/web";

// Add a prop to accept the averageColor
type SongControlsProps = {
  averageColor: string | undefined;
  secondatyColor: string | undefined;
};

const SongControls: Component<SongControlsProps> = (props) => {
  const [isHovering, setIsHovering] = createSignal(false);

  const disable = createMemo(() => isSongUndefined(song()));
  const playHint = createMemo(() => {
    const disabled = disable();
    if (disabled) {
      return "";
    }

    return isPlaying() ? "Pause" : "Play";
  });

  return (
    <div class="flex w-full items-center gap-4" style={{ "--dynamic-color": props.averageColor }}>
      <LeftPart />
      <div class="flex flex-1 items-center justify-center gap-6">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => window.api.request("queue::shuffle")}
          disabled={disable()}
          title="Shuffle"
        >
          <ShuffleIcon size={20} />
        </Button>

        <div class="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => previous()}
            disabled={disable()}
            title="Play previous"
          >
            <SkipBackIcon size={20} />
          </Button>

          <button
            class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-surface text-2xl text-thick-material text-white shadow-lg ring-1 ring-stroke transition-all active:scale-95"
            classList={{
              "opacity-50 !cursor-default": disable(),
            }}
            onClick={() => togglePlay()}
            disabled={disable()}
            title={playHint()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              "background-color": isHovering() ? props.secondatyColor : props.averageColor,
            }}
          >
            <Show when={!isPlaying()} fallback={<PauseIcon fill="white" size={20} />}>
              <PlayIcon fill="white" size={20} />
            </Show>
          </button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => next()}
            disabled={disable()}
            title="Play next"
          >
            <SkipForwardIcon size={20} />
          </Button>
        </div>

        <Button
          variant={"ghost"}
          size="icon"
          onClick={() => {
            //TODO: - implement repeat
          }}
          disabled={disable()}
          title="Repeat"
        >
          <RepeatIcon size={20} />
        </Button>
      </div>
      <RightPart />
    </div>
  );
};

// LeftPart component updated to include averageColor prop for styling
const LeftPart = () => {
  const [isHoveringVolume, setIsHoveringVolume] = createSignal(false);
  let isHoverintTimeoutId: NodeJS.Timeout;

  const showVolumeSlider = () => {
    clearTimeout(isHoverintTimeoutId);
    setIsHoveringVolume(true);
  };
  const hideVolumeSlider = () => {
    isHoverintTimeoutId = setTimeout(() => {
      setIsHoveringVolume(false);
    }, 320);
  };

  return (
    <div class="flex-1">
      <div
        class="group flex w-max items-center gap-4"
        onMouseEnter={showVolumeSlider}
        onMouseLeave={hideVolumeSlider}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={handleMuteSong}
          onFocus={showVolumeSlider}
          onBlur={hideVolumeSlider}
        >
          <Switch>
            <Match when={volume() === 0}>
              <VolumeXIcon size={20} />
            </Match>
            <Match when={volume() < 0.5}>
              <Volume1Icon size={20} />
            </Match>
            <Match when={volume() >= 0.5}>
              <Volume2Icon size={20} />
            </Match>
          </Switch>
        </Button>

        <Show when={isHoveringVolume()}>
          <Slider
            class="flex h-8 w-24 flex-grow items-center"
            min={0}
            max={1}
            value={volume}
            onValueChange={setVolume}
            enableWheelSlide
          >
            <Slider.Track class="h-1 flex-1 rounded bg-thick-material ring-1 ring-stroke">
              <Slider.Range class="block h-1 rounded bg-white" />
            </Slider.Track>
            <Slider.Thumb
              onFocus={showVolumeSlider}
              onBlur={hideVolumeSlider}
              class="mt-2 block h-4 w-4 rounded-full bg-white"
            />
          </Slider>
        </Show>
      </div>
    </div>
  );
};

const PREDEFINED_SPEEDS: number[] = [0.25, 0.5, 1, 1.5, 2] as const;
const MIN_SPEED_AMOUNT = PREDEFINED_SPEEDS[0];
const MAX_SPEED_AMOUNT = PREDEFINED_SPEEDS.at(-1);
const RightPart = () => {
  const [isPopoverOpen, setisPopoverOpen] = createSignal(false);

  return (
    <div class="flex flex-1 justify-end gap-4">
      <Popover
        isOpen={isPopoverOpen}
        onValueChange={setisPopoverOpen}
        placement="top-end"
        offset={{
          mainAxis: 10,
        }}
      >
        <Popover.Anchor>
          <Button
            onClick={() => setisPopoverOpen(true)}
            size="icon"
            variant="ghost"
            title="Set speed"
          >
            <GaugeIcon size={20} />
          </Button>
        </Popover.Anchor>

        <Portal>
          <Popover.Overlay />
          <Popover.Content class="flex w-fit min-w-48 flex-col rounded-xl bg-thick-material px-1.5 py-3 shadow-xl ring-1 ring-inset ring-stroke backdrop-blur-md">
            <p class="gap-1 px-2 text-sm font-medium text-subtext">Custom Speed</p>
            <div class="flex flex-col px-2">
              <Slider
                class="flex h-8 flex-grow items-center"
                min={MIN_SPEED_AMOUNT}
                max={MAX_SPEED_AMOUNT}
                value={speed}
                onValueChange={setSpeed}
                enableWheelSlide
              >
                <Slider.Track class="h-1 flex-1 rounded bg-thick-material ring-1 ring-stroke">
                  <Slider.Range class="block h-1 rounded bg-white" />
                </Slider.Track>
                <Slider.Thumb class="mt-2 block h-4 w-4 rounded-full bg-white" />
              </Slider>
              <div class="text-xs">{Math.round(speed() * 100) / 100}x</div>
            </div>
            <div class="my-2 h-px w-full bg-stroke" />

            <For each={PREDEFINED_SPEEDS}>
              {(amount) => <SpeedOption amount={amount}>{amount}</SpeedOption>}
            </For>
          </Popover.Content>
        </Portal>
      </Popover>
      <Button
        size="icon"
        variant="ghost"
        title="Add to playlist"
        disabled={isSongUndefined(song())}
        onClick={() => {
          if (!isSongUndefined(song())) openPlaylistPicker(song());
        }}
      >
        <CirclePlusIcon size={20} />
      </Button>
    </div>
  );
};

type SpeedOptionProps = {
  amount: number;
};
const SpeedOption: ParentComponent<SpeedOptionProps> = (props) => {
  return (
    <button
      onClick={() => setSpeed(props.amount)}
      class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-surface focus:outline-none disabled:pointer-events-none disabled:opacity-50"
    >
      {props.children}
    </button>
  );
};

export default SongControls;
