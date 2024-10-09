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
  const [isHoveringVolume, setIsHoveringVolume] = createSignal(false);

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
      {/* Left part */}
      <div class="song-controls__left-part">
        <div
          onMouseEnter={() => setIsHoveringVolume(true)}
          onMouseLeave={() => setIsHoveringVolume(false)}
          // TODO - REMOVE - ONLY FOR TESTING!
          style={{
            display: "flex",
            "align-items": "center",
            gap: "12px"
          }}
        >
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
          <Show when={isHoveringVolume()}>
            <Slider
              class="song-controls__volume"
              min={0}
              max={1}
              value={volume}
              onValueChange={setVolume}
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

      {/* Middle */}
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

      {/* Right part */}
      <div class="song-controls__right-part">
        <IconButton>
          <i class="ri-add-fill" />
        </IconButton>
      </div>
    </div>
  );
};

export default SongControls;
