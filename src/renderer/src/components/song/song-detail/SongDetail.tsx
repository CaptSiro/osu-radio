import { Component, createSignal } from "solid-js";
import { FastAverageColor } from "fast-average-color"; // Import FastAverageColor
import Bar from "../../bar/Bar";
import { seek, duration, song, timestamp } from "@renderer/components/song/song.utils";
import formatTime from "../../../lib/time-formatter";
import SongImage from "../SongImage";
import SongControls from "./SongControls";
import { isSongUndefined } from "../../../lib/song";
import "./styles.css";

const SongDetail: Component = () => {
  const [avgColor, setAvgColor] = createSignal<string>("black"); // Default color

  const handleImageLoad = (imageElement: HTMLImageElement) => {
    const fac = new FastAverageColor();

    fac.getColorAsync(imageElement)
      .then((color) => {
        setAvgColor(color.hex); // Set the average color in hex format
      })
      .catch((err) => {
        console.error("Error extracting color:", err);
      });
  };

  // Helper function to convert hex to rgba
  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <div class="song-detail">
      <div
        class="song-detail__song-bg"
        style={{ "--box-shadow-color": hexToRgba(avgColor(), 0.32) }}
      >
        {/* Pass the handleImageLoad function to SongImage */}
        <SongImage src={song().bg} instantLoad={true} onImageLoad={handleImageLoad} />
      </div>

      <div class="song-detail__bottom-part">
        <div class="song-detail__texts">
          <h2 class="song-detail__title">{song().title}</h2>
          <span class="song-detail__artist"></span>
        </div>

        <Bar
          fill={timestamp() / (duration() !== 0 ? duration() : 1)}
          setFill={seek}
          disabled={isSongUndefined(song())}
          color={avgColor()}
        />
        <div class="song-detail__time">
          <span>{!isNaN(timestamp()) ? formatTime(timestamp() * 1_000) : "--:--"}</span>
          <span>{!isNaN(duration()) && duration() > 0 ? formatTime(duration() * 1_000) : "--:--"}</span>
        </div>

        {/* Pass the avgColor to SongControls */}
        <SongControls avgColor={avgColor()} />
      </div>
    </div>
  );
};

export default SongDetail;