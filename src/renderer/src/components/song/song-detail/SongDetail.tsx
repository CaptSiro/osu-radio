import { Component, createMemo, Show } from "solid-js";
import {
  seek,
  duration,
  song,
  timestamp,
  handleSeekStart,
  handleSeekEnd
} from "@renderer/components/song/song.utils";
import formatTime from "../../../lib/time-formatter";
import SongImage from "../SongImage";
import SongControls from "./SongControls";
import "./styles.css";
import Slider from "@renderer/components/slider/Slider";

const SongDetail: Component = () => {
  return (
    <div class="song-detail">
      <div class="song-detail__song-bg">
        <SongImage src={song().bg} instantLoad={true} />
      </div>

      <div class="song-detail__bottom-part">
        <div class="song-detail__texts">
          <h2 class="song-detail__title">{song().title}</h2>
          <span class="song-detail__artist">{song().artist}</span>
        </div>

        <ProgressBar />
        <SongControls />
      </div>
    </div>
  );
};

const ProgressBar = () => {
  const currentValue = createMemo(() => {
    return timestamp() / (duration() !== 0 ? duration() : 1);
  });

  return (
    <Slider
      min={0}
      max={1}
      value={currentValue}
      onValueChange={seek}
      onValueStart={handleSeekStart}
      onValueCommit={handleSeekEnd}
    >
      <Slider.Track class="progress-bar__track">
        <Slider.Range class="progress-bar__range" />
      </Slider.Track>
      <Slider.Thumb class="progress-bar__thumb" />
      <Slider.Time class="progress-bar__time">{formatTime(timestamp() * 1_000)}</Slider.Time>

      <Show when={currentValue() < 0.94}>
        <span class="progress-bar__total">{formatTime(duration() * 1_000)}</span>
      </Show>
    </Slider>
  );
};

export default SongDetail;
