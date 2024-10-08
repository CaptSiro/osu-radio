import { Router } from "../lib/route-pass/Router";
import { Storage } from "../lib/storage/Storage";
import { delay } from "../lib/delay-backend";
import { AudioSource, ResourceID } from "../../@types";

const [writeAudioSource] = delay((audioID: ResourceID, audioSource: AudioSource) => {
  Storage.getTable("audio").write(audioID, audioSource);
}, 200);

Router.respond("save::localVolume", (_evt, localVolume, songID) => {
  const song = Storage.getTable("songs").get(songID);

  if (song.isNone) {
    return;
  }

  const audio = Storage.getTable("audio").get(song.value.audio);

  if (audio.isNone) {
    return;
  }

  console.log("audio", audio);
  audio.value.volume = localVolume;
  writeAudioSource(song.value.audio, audio.value);
});
