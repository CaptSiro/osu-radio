import DEFAULT_SONG_BG_SMALL from "@renderer/assets/osu-default-background-small.jpg";
import { delay } from "@renderer/lib/delay";
import { createDefaultSong, isSongUndefined, msToBPM } from "@renderer/lib/song";
import { none, some } from "@shared/lib/rust-types/Optional";
import { Optional, Song } from "@shared/types/common.types";
import { createSignal } from "solid-js";

/** Range from 0 to 1. */
export type ZeroToOne = number;

const DEFAULT_SONG = createDefaultSong();

// ------------
// State
// ------------
const [media, setMedia] = createSignal<URL>();
export { media, setMedia };

const [song, setSong] = createSignal<Song>(DEFAULT_SONG);
export { setSong, song };

const [duration, setDuration] = createSignal(0);
export { duration, setDuration };

const [timestamp, setTimestamp] = createSignal(0);
export { setTimestamp, timestamp };

const [valueBeforeMute, setValueBeforeMute] = createSignal<ZeroToOne>(0.3);
export { setValueBeforeMute, valueBeforeMute };

const [isSeeking, setIsSeeking] = createSignal({
  value: false,
  pausedSeekingStart: false,
});
export { isSeeking, setIsSeeking };

const [volume, _setVolume] = createSignal<ZeroToOne>(0.3);

const [writeVolume] = delay(async (volume: number) => {
  await window.api.request("settings::write", "volume", volume);
}, 200);

const player = new Audio();

export const setVolume = (newValue: ZeroToOne) => {
  _setVolume(newValue);
  player.volume = newValue;
  writeVolume(newValue);
};

const [speed, _setSpeed] = createSignal<ZeroToOne>(1);
export const setSpeed = (newValue: ZeroToOne) => {
  _setSpeed(newValue);
  player.playbackRate = newValue;
};
export { speed, volume };

let resizedBg: Optional<string>;

// Initialize settings
window.api.request("settings::get", "volume").then((v) => {
  if (v.isNone) return;
  setVolume(v.value);
  setValueBeforeMute(v.value);
});

window.api.request("settings::get", "audioDeviceId").then((v) => {
  if (v.isNone) return;
  changeAudioDevice(v.value);
});

player.volume = volume();

const [bpm, setBPM] = createSignal<Optional<number>>(none(), {
  equals: (prev, next) => {
    if (prev.isNone && !next.isNone) return true;
    if (!prev.isNone && next.isNone) return true;
    if (!prev.isNone && !next.isNone) return prev.value !== next.value;
    return true;
  },
});
export { bpm };

const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
export { isPlaying };

async function getCurrent(): Promise<{ song: Song; media: URL } | undefined> {
  const song = await window.api.request("queue::current");
  if (song.isNone) return;

  const resource = await window.api.request("resource::getPath", song.value.audio);
  if (resource.isError) return;

  return {
    song: song.value,
    media: new URL(resource.value),
  };
}

const [updateDiscordPresence] = delay(
  async (currentSong: Song, duration: number, currentTime: number) => {
    await window.api.request("discord::play", currentSong, duration, currentTime);
  },
  2000,
);

export async function play(): Promise<void> {
  if (media() === undefined) {
    const current = await getCurrent();
    if (current === undefined) {
      console.error("Cannot play current song");
      return;
    }
    setSong(current.song);
    setMedia(current.media);
  }

  const currentSong = song();

  const m = media();
  if (m !== undefined && player.src !== m.href) {
    player.src = m.href;
  }

  setIsPlaying(true);
  await player.play().catch((reason) => console.error(reason));

  const waitForDuration = async (): Promise<number> => {
    while (isNaN(player.duration)) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return player.duration;
  };
  const duration = await waitForDuration();
  updateDiscordPresence(currentSong, duration, player.currentTime);

  setIsPlaying(true);

  await setMediaSession(currentSong);
}

export async function pause() {
  const currentSong = song();
  setIsPlaying(false);
  player.pause();
  await window.api.request("discord::pause", currentSong);
}

export async function changeAudioDevice(deviceId: string) {
  await window.api.request("settings::write", "audioDeviceId", deviceId);
  if ("setSinkId" in player && typeof player.setSinkId === "function") {
    player.setSinkId(deviceId);
  } else {
    console.error("Changing audio devices is not supported in your environment.");
  }
}

export async function next() {
  await window.api.request("queue::next");
  const current = await getCurrent();
  if (current === undefined) {
    console.error("Can't forward queue");
    return;
  }

  player.src = current.media.href;
  setMedia(current.media);
  setSong(current.song);

  if (isPlaying()) {
    await play();
  } else {
    await setMediaSession(current.song);
  }
}

export async function previous() {
  await window.api.request("queue::previous");
  const current = await getCurrent();
  if (current === undefined) {
    console.error("Can't rollback queue");
    return;
  }

  player.src = current.media.href;
  setMedia(current.media);
  setSong(current.song);

  if (isPlaying()) {
    await play();
  } else {
    await setMediaSession(current.song);
  }
}

export async function togglePlay(force?: boolean): Promise<void> {
  if (force !== undefined) {
    if (force === true) {
      await play();
      return;
    }
    await pause();
    return;
  }

  if (isPlaying()) {
    await pause();
    return;
  }

  await play();
}

export async function seek(range: ZeroToOne): Promise<void> {
  if (isNaN(player.duration)) {
    return;
  }

  const newTime = range * duration();
  player.currentTime = newTime;
  setTimestamp(newTime);
}

// Media Session functions
async function setMediaSession(song: Song) {
  const bgPath = song.bg ?? DEFAULT_SONG_BG_SMALL;
  resizedBg = await window.api.request("resource::getResizedBg", bgPath);

  if ("mediaSession" in navigator) {
    await setMediaSessionMetadata();
    setMediaSessionPosition();

    const actionHandlers = {
      play: () => togglePlay(),
      pause: () => pause(),
      previoustrack: previous,
      nexttrack: next,
    };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      try {
        navigator.mediaSession.setActionHandler(
          action as MediaSessionAction,
          handler as MediaSessionActionHandler,
        );
      } catch {
        console.log(`The media session action "${action}" is not supported yet.`);
      }
    }
  }
}

async function setMediaSessionMetadata() {
  if (resizedBg.isNone) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song().title,
    artist: song().artist,
    artwork: [
      { src: resizedBg.value, sizes: "96x96", type: "image/png" },
      { src: resizedBg.value, sizes: "128x128", type: "image/png" },
      { src: resizedBg.value, sizes: "192x192", type: "image/png" },
      { src: resizedBg.value, sizes: "256x256", type: "image/png" },
      { src: resizedBg.value, sizes: "384x384", type: "image/png" },
      { src: resizedBg.value, sizes: "512x512", type: "image/png" },
    ],
  });
}

function setMediaSessionPosition() {
  if ("setPositionState" in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: player.duration,
      playbackRate: player.playbackRate,
      position: player.currentTime,
    });
  }
}

export const saveLocalVolume = async (localVolume: ZeroToOne, song: Song) => {
  if (isSongUndefined(song) || localVolume === 0.5) return;

  const stored = await window.api.request("resource::get", song.audio);
  if (!stored.isNone && stored.value.volume === localVolume) return;

  await window.api.request("save::localVolume", localVolume, song.audio);
};

// Event Listeners
window.api.listen("queue::songChanged", async (s) => {
  const resource = await window.api.request("resource::getPath", s.audio);
  if (resource.isError) return;

  setMedia(new URL(resource.value));
  setSong(s);
  await play();
  player.playbackRate = speed();
});

player.addEventListener("ended", async () => {
  if (isSeeking().value) {
    return;
  }

  await next();
});

const OFFSET = 0;
const BPM = 1;

player.addEventListener("loadedmetadata", () => {
  setDuration(player.duration);
});
player.addEventListener("timeupdate", async () => {
  setTimestamp(player.currentTime);
  const currentSong = song();

  // Media session
  setMediaSessionPosition();

  if (isSongUndefined(currentSong) || currentSong.bpm[0]?.[OFFSET] / 1000 > player.currentTime) {
    return;
  }

  const bpmOpt = currentBPM(player.currentTime, currentSong.bpm);
  const current = bpm();

  if (!bpmOpt.isNone && !current.isNone && bpmOpt.value !== current.value) {
    setBPM(some(bpmOpt.value));
  }
});

function currentBPM(offset: number, changes: number[][]): Optional<number> {
  if (changes.length === 0 || offset < changes[0][OFFSET] / 1000) {
    return none();
  }

  for (let i = 1; i < changes.length; i++) {
    if (changes[0][OFFSET] / 1000 <= offset && offset < changes[i][OFFSET] / 1000) {
      return some(msToBPM(changes[i - 1][BPM]));
    }
  }

  return some(msToBPM(changes[changes.length - 1][BPM]));
}

export const handleSeekStart = () => {
  setIsSeeking({
    value: true,
    pausedSeekingStart: player.paused,
  });

  player.pause();
};

export const handleSeekEnd = () => {
  const pausedSeekingStart = isSeeking().pausedSeekingStart;

  setIsSeeking({
    value: false,
    pausedSeekingStart: false,
  });

  if (player.duration === player.currentTime) {
    next();
    return;
  }

  if (!pausedSeekingStart) {
    play();
  }
};

export const handleMuteSong = () => {
  if (volume() === 0) {
    setVolume(valueBeforeMute());
    return;
  }

  setValueBeforeMute(volume());
  setVolume(0);
};
