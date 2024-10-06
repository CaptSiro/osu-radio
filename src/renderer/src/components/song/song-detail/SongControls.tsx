import { Component, createEffect, createSignal, Match, Show, Switch } from "solid-js";
import {
  isPlaying,
  next,
  previous,
  togglePlay,
  localVolume,
  setLocalVolume,
  song
} from "../../../components/song/song.utils";
import { isSongUndefined } from "../../../lib/song";
import Fa from "solid-fa";
import {
  faBackwardStep,
  faForwardStep,
  faPause,
  faPlay,
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
  faAdd,
  faRandom,
  faRepeat
} from "@fortawesome/free-solid-svg-icons";
import { GLOBAL_ICON_SCALE } from "../../../App";
import Bar from "../../bar/Bar";
import IconButton from "@renderer/components/icon-button/IconButton";

type SongControlsProps = {
  avgColor: string; // Accept avgColor as a prop
};

const SongControls: Component<SongControlsProps> = (props) => {
  const [disable, setDisable] = createSignal(isSongUndefined(song()));
  const [playHint, setPlayHint] = createSignal("");
  const [isVolumeBarVisible, setIsVolumeBarVisible] = createSignal(false); // Signal to track visibility

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
    <div class="song-controls" style={{ "--dynamic-color": props.avgColor }}>
      {/* Left part */}
      <div
        class="song-controls__left-part"
        onMouseEnter={() => setIsVolumeBarVisible(true)}  // Show on hover
        onMouseLeave={() => setIsVolumeBarVisible(false)} // Hide when not hovered
      >
        <IconButton>
          <Switch>
            <Match when={localVolume() === 0}>
              <Fa icon={faVolumeXmark} scale={GLOBAL_ICON_SCALE} />
            </Match>
            <Match when={localVolume() < 0.5}>
              <Fa icon={faVolumeLow} scale={GLOBAL_ICON_SCALE} />
            </Match>
            <Match when={localVolume() >= 0.5}>
              <Fa icon={faVolumeHigh} scale={GLOBAL_ICON_SCALE} />
            </Match>
          </Switch>
        </IconButton>
        {/* Volume bar slider */}
        <div
          class="song-controls__volume-bar"
          classList={{ visible: isVolumeBarVisible() }}  // Add visible class when hovered
          style={{ "--bar-fill-color": props.avgColor }}
        >
          <Bar fill={localVolume()} setFill={setLocalVolume} color={props.avgColor} />
        </div>
      </div>

      {/* Middle */}
      <div class="song-controls__middle">
        <IconButton
          onClick={() => window.api.request("queue::shuffle")}
          disabled={disable()}
          title="Shuffle"
        >
          <Fa icon={faRandom} scale={GLOBAL_ICON_SCALE} />
        </IconButton>
        <IconButton onClick={() => previous()} disabled={disable()} title="Play previous">
          <Fa icon={faBackwardStep} scale={GLOBAL_ICON_SCALE} />
        </IconButton>

        {/* Play button with dynamic background color */}
        <button
          class="song-controls__toggle-play"
          onClick={() => togglePlay()}
          disabled={disable()}
          title={playHint()}
        >
          <Show when={!isPlaying()} fallback={<Fa icon={faPause} scale={GLOBAL_ICON_SCALE} />}>
            <Fa icon={faPlay} scale={GLOBAL_ICON_SCALE} />
          </Show>
        </button>

        <IconButton onClick={() => next()} disabled={disable()} title="Play next">
          <Fa icon={faForwardStep} scale={GLOBAL_ICON_SCALE} />
        </IconButton>

        <IconButton onClick={() => previous()} disabled={disable()} title="Repeat">
          <Fa icon={faRepeat} scale={GLOBAL_ICON_SCALE} />
        </IconButton>
      </div>

      {/* Right part */}
      <div class="song-controls__right-part">
        <IconButton>
          <Fa icon={faAdd} scale={GLOBAL_ICON_SCALE} />
        </IconButton>
      </div>

      {/* Song play bar slider */}
    </div>
  );
};

export default SongControls;
