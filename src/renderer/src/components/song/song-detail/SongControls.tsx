import { Component, createEffect, createSignal, Match, Show, Switch } from "solid-js";
import {
  isPlaying,
  next,
  previous,
  togglePlay,
  song,
  setVolume,
  volume
} from "../../../components/song/song.utils";
import { isSongUndefined } from "../../../lib/song";
import IconButton from "@renderer/components/icon-button/IconButton";
import Slider from "@renderer/components/slider/Slider";

type SongControlsProps = {};

const SongControls: Component<SongControlsProps> = () => {
  const [disable, setDisable] = createSignal(isSongUndefined(song()));
  const [playHint, setPlayHint] = createSignal("");

  createEffect(() => {
    const disabled = disable();

    if (disabled) {
      setPlayHint("");
      return;
    }

    setPlayHint(isPlaying() ? "Pause" : "Play");
  });

  createEffect(() => setDisable(isSongUndefined(song())));

  return (
    <div class="song-controls">
      <LeftPart />
      <div class="song-controls__middle">
        <IconButton
          onClick={() => window.api.request("queue::shuffle")}
          disabled={disable()}
          title="Shuffle"
        >
          <i class="ri-shuffle-fill" />
        </IconButton>
        <IconButton onClick={() => previous()} disabled={disable()} title="Play previous">
          <i class="ri-skip-back-mini-fill" />
        </IconButton>

        <button
          class="song-controls__toggle-play"
          onClick={() => togglePlay()}
          disabled={disable()}
          title={playHint()}
        >
          <Show when={!isPlaying()} fallback={<i class="ri-pause-fill" />}>
            <i class="ri-play-fill" />
          </Show>
        </button>

        <IconButton onClick={() => next()} disabled={disable()} title="Play next">
          <i class="ri-skip-forward-mini-fill"></i>
        </IconButton>

        <IconButton
          onClick={() => {
            // TODO - implement repeat
          }}
          disabled={disable()}
          title="Repeat"
        >
          <i class="ri-repeat-2-fill" />
        </IconButton>
      </div>
      <RightPart />
    </div>
  );
};

const LeftPart = () => {
  const [isHoveringVolume, setIsHoveringVolume] = createSignal(false);

  return (
    <div class="song-controls__left-part-wrapper">
      <div
        class="song-controls__left-part"
        onMouseEnter={() => setIsHoveringVolume(true)}
        onMouseLeave={() => setIsHoveringVolume(false)}
      >
        <IconButton>
          <Switch>
            <Match when={volume() === 0}>
              <i class="ri-volume-mute-fill" />
            </Match>
            <Match when={volume() < 0.5}>
              <i class="ri-volume-down-fill" />
            </Match>
            <Match when={volume() >= 0.5}>
              <i class="ri-volume-up-fill" />
            </Match>
          </Switch>
        </IconButton>

        <Show when={isHoveringVolume()}>
          <Slider
            class="song-controls__volume"
            min={0}
            max={1}
            value={volume}
            onValueChange={(v) => {
              console.log("setVolume", v);
              setVolume(v);
            }}
            enableWheelSlide
          >
            <Slider.Track class="song-controls__volume-track">
              <Slider.Range class="song-controls__volume-range" />
            </Slider.Track>
            <Slider.Thumb class="song-controls__volume-thumb" />
          </Slider>
        </Show>
      </div>
    </div>
  );
};

const RightPart = () => {
  return (
    <div class="song-controls__right-part">
      <IconButton>
        <i class="ri-add-fill" />
      </IconButton>
    </div>
  );
};

export default SongControls;
