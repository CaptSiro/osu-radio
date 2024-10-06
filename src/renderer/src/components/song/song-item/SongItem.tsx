import { Component, createSignal, JSX, onMount } from "solid-js";
import { ResourceID, Song } from "../../../../../@types";
import { ignoreClickInContextMenu } from "../context-menu/SongContextMenu";
import draggable from "../../../lib/draggable/draggable";
import { song as selectedSong } from "../../../components/song/song.utils";
import SongHint from "../SongHint";
import SongImage from "../SongImage";
import formatTime from "../../../lib/time-formatter";
import { FastAverageColor } from "fast-average-color"; // Import FastAverageColor
import "./styles.css";

type SongItemProps = {
  song: Song;
  group: string;
  selectable?: true;
  onSelect: (songResource: ResourceID) => any;
  draggable?: true;
  onDrop?: (before: Element | null) => any;
  children?: any;
};

const SongItem: Component<SongItemProps> = ({
  group,
  onSelect,
  song,
  children,
  draggable: isDraggable,
  onDrop,
  selectable
}) => {
  const showSignal = createSignal(false);
  const [_coords, setCoords] = createSignal<[number, number]>([0, 0], { equals: false });
  const [avgColor, setAvgColor] = createSignal<string>("black"); // Default color

  let item: HTMLElement;

  const showMenu = (evt: MouseEvent) => {
    if (children === undefined) {
      showSignal[1](false);
      return;
    }

    setCoords([evt.clientX, evt.clientY]);
    showSignal[1](true);
  };

  // Handle image load and color extraction
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

  onMount(() => {
    draggable(item, {
      onClick: ignoreClickInContextMenu(() => onSelect(song.path)),
      onDrop: onDrop ?? (() => {}),
      createHint: SongHint,
      useOnlyAsOnClickBinder: !isDraggable || selectedSong().path === song.path
    });

    if (selectable === true) {
      (item as HTMLElement).dataset.path = song.path;
    }
  });

  return (
    <div
      class="song-item"
      data-active={selectedSong().path === song.path}
      ref={(el) => item = el as HTMLElement} // Assign item using Solid.js ref pattern
      data-url={song.bg}
      onContextMenu={showMenu}
      style={{ backgroundColor: avgColor() } as JSX.CSSProperties} // Use the extracted average color
    >
      <SongImage
        class="song-item__image"
        src={song.bg}
        group={group}
        onImageLoad={handleImageLoad} // Pass the handleImageLoad function to extract color
      />

      <div class="song-item__container">
        <h3 class="song-item__title">{song.title}</h3>
        <p class="song-detail__artist">
          {song.artist}
          {" // "}
          {formatTime(song.duration * 1_000)} {/* Add song length here */}
        </p>
      </div>
    </div>
  );
};

export default SongItem;