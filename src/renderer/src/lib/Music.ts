import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { AudioSource, Optional, Song } from "../../../@types";
import { delay } from "./delay";
import { none, some } from "./rust-like-utils-client/Optional.js";
import { createDefaultSong, isSongUndefined, msToBPM } from "./song";

type ZeroToOne = number;

const player = new Audio();

const [media, setMedia] = createSignal<string>();

const [song, setSong] = createStore<Song>(createDefaultSong());
export { song };

const [duration, setDuration] = createSignal(0);
export { duration };

const [timestamp, setTimestamp] = createSignal(0);
export { timestamp };

const [volume, setVolume] = createSignal<ZeroToOne>(0.3);
export { setVolume, volume };
window.api.request("settings::get", "volume").then((v) => {
  if (v.isNone) {
    return;
  }
  setVolume(v.value);
});

window.api.request("settings::get", "audioDeviceId").then((v) => {
  if (v.isNone) {
    return;
  }

  changeAudioDevice(v.value);
});

let bgPath;

const [localVolume, setLocalVolume] = createSignal<ZeroToOne>(0.5);
export { localVolume, setLocalVolume };

function calculateVolume(): number {
  const v = volume();
  return v + (localVolume() - 0.5) * 2 * v;
}
player.volume = calculateVolume();

const [bpm, setBPM] = createSignal<Optional<number>>(none(), {
  equals: (prev, next) => {
    if (prev.isNone && !next.isNone) {
      return true;
    }

    if (!prev.isNone && next.isNone) {
      return true;
    }

    if (!prev.isNone && !next.isNone) {
      return prev.value !== next.value;
    }

    return true;
  },
});
export { bpm };

const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
export { isPlaying };

async function getCurrent(): Promise<{ song: Song; media: string } | undefined> {
  const song = await window.api.request("queue::current");

  if (song.isNone) {
    return;
  }

  const resource = await window.api.request("resource::getPath", song.value.audio);

  if (resource.isError) {
    return;
  }
  return {
    song: song.value,
    media: resource.value,
  };
}

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

  const current = await getCurrent();
  if (current === undefined) {
    return;
  }

  const m = media();

  player.addEventListener("loadedmetadata", async () => {
    await window.api.request("discord::play", current.song, player.currentTime, player.duration);
  });

  if (m !== undefined && player.src !== m) {
    player.src = m;
  }

  player.volume = calculateVolume();

  await player.play().catch((reason) => console.error(reason));

  setIsPlaying(true);
}

export async function pause() {
  const song = await getCurrent();
  if (song === undefined) {
    return;
  }

  await window.api.request("discord::pause", song.song);

  setIsPlaying(false);
  player.pause();
}

export async function changeAudioDevice(deviceId: string) {
  await window.api.request("settings::write", "audioDeviceId", deviceId);
  if ("setSinkId" in player && typeof player.setSinkId === "function") {
    player.setSinkId(deviceId);
  } else {
    console.error("Changing audio devices is not supported in your enviornment.");
  }
}

export async function next() {
  await window.api.request("queue::next");

  const current = await getCurrent();
  if (current === undefined) {
    console.error("Can't forward queue");
    return;
  }

  player.src = current.media;
  setMedia(current.media);

  if (isPlaying() === true) {
    await play();
  }

  setSong(current.song);
  await setMediaSession(current.song);
}

export async function setMediaSession(song: Song) {
  bgPath = await window.api.request("resource::getMediaSessionImage", song.bg!);
  if (bgPath.isNone) {
    return;
  }

  if ("mediaSession" in navigator) {
    if (
      navigator.mediaSession.metadata?.artist !== song.artist &&
      navigator.mediaSession.metadata?.title !== song.title &&
      navigator.mediaSession.metadata?.artwork[0].src !== bgPath
    ) {
      setMediaSessionMetadata();
    }
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
      } catch (err) {
        console.log(`The media session action "${action}" is not supported yet.`);
      }
    }
  }
}

async function setMediaSessionMetadata() {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    artwork: [
      // just apply every size and pray that an image shows correctly Pepega
      { src: bgPath.value, sizes: "96x96", type: "image/png" },
      { src: bgPath.value, sizes: "128x128", type: "image/png" },
      { src: bgPath.value, sizes: "192x192", type: "image/png" },
      { src: bgPath.value, sizes: "256x256", type: "image/png" },
      { src: bgPath.value, sizes: "384x384", type: "image/png" },
      { src: bgPath.value, sizes: "512x512", type: "image/png" },
    ],
  });
}

function setMediaSessionPosition() {
  if ("setPositionState" in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: song.duration,
      playbackRate: player.playbackRate,
      position: player.currentTime,
    });
  }
}

export async function previous() {
  await window.api.request("queue::previous");

  const current = await getCurrent();
  if (current === undefined) {
    console.error("Can't rollback queue");
    return;
  }

  player.src = current.media;
  setMedia(current.media);

  if (isPlaying() === true) {
    await play();
  }

  setSong(current.song);
  await setMediaSession(current.song);
}

export async function togglePlay(force?: boolean): Promise<void> {
  const current = await getCurrent();
  if (!current) {
    return;
  }

  if (force !== undefined) {
    if (force === true) {
      await window.api.request("discord::play", current.song, timestamp(), duration());
      await play();
      return;
    }

    await pause();
    return;
  }

  if (isPlaying() === true) {
    await pause();
    return;
  }
  await window.api.request("discord::play", current.song, timestamp(), duration());
  await play();
}

export async function seek(range: ZeroToOne): Promise<void> {
  if (isNaN(player.duration)) {
    return;
  }

  player.currentTime = range * player.duration;

  const current = await getCurrent();
  if (!current) {
    return;
  }

  player.addEventListener("loadedmetadata", async () => {
    await window.api.request("discord::play", current.song, player.currentTime, player.duration);
  });

  setDuration(player.duration);
  setTimestamp(player.currentTime);
}

createEffect(async () => {
  setBPM(none());

  const audio = (await window.api.request(
    "resource::get",
    song.audio,
    "audio",
  )) as Optional<AudioSource>;

  if (audio.isNone) {
    return;
  }

  setLocalVolume(audio.value.volume ?? 0.5);
});

createEffect(() => {
  player.volume = calculateVolume();
});

const [writeVolume] = delay(async (volume: number) => {
  await window.api.request("settings::write", "volume", volume);
}, 200);
createEffect(async () => {
  const v = volume();
  writeVolume(v);
});

createEffect(async () => {
  const lv = localVolume();

  if (isSongUndefined(song) || lv === 0.5) {
    return;
  }

  const audio = (await window.api.request(
    "resource::get",
    song.audio,
    "audio",
  )) as Optional<AudioSource>;

  if (!audio.isNone && audio.value.volume === lv) {
    return;
  }

  await window.api.request("save::localVolume", lv, song.path);
});

window.api.listen("queue::songChanged", async (s) => {
  const resource = await window.api.request("resource::getPath", s.audio);

  if (resource.isError) {
    return;
  }
  setMedia(resource.value);
  setSong(s);
  await play();
});

player.addEventListener("ended", async () => {
  await next();
});

const OFFSET = 0;
const BPM = 1;

player.addEventListener("timeupdate", () => {
  setTimestamp(player.currentTime);
  setDuration(player.duration);

  if (isSongUndefined(song) || song.bpm[0][OFFSET] / 1000 > player.currentTime) {
    return;
  }

  const bpmOpt = currentBPM(player.currentTime, song.bpm);
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
