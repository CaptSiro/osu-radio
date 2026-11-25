import type {
  InfiniteScrollerInitResponse,
  InfiniteScrollerRequest,
  InfiniteScrollerResponse,
  Optional,
  PlaylistID,
  PlaylistInfo,
  QueueCreatePayload,
  ResourceID,
  Result,
  Settings,
  Song,
  SongsQueryPayload,
  LoadingSceneUpdate,
  NoticeTypeIconMap,
  Scenes,
} from "./common.types";
import type { SearchQuery } from "./search-parser.types";
import type { ConfigError, ConfigSuccess } from "./template-parser.types";

export type OsuDirectory = {
  version: "stable" | "lazer" | "none";
  path: string;
};

export type RequestAPI = {
  "resource::get": (id: ResourceID) => Optional<Song>;
  "resource::getPath": (id: any) => Result<string, string>;
  "resource::getResizedBg": (bgPath: string) => Optional<string>;

  "queue::exists": () => boolean;
  "queue::current": () => Optional<Song>;
  "queue::duration": () => Optional<number>;
  "queue::remainingDuration": () => Optional<number>;
  "queue::next": () => void;
  "queue::previous": () => void;
  "queue::play": (song: ResourceID) => void;
  "queue::playNext": (song: ResourceID) => void;
  "queue::place": (what: ResourceID, after: ResourceID | undefined) => void;
  "queue::removeSong": (song: ResourceID | undefined) => void;
  "queue::create": (payload: QueueCreatePayload) => void;
  "queue::shuffle": () => void;
  "queue::addPlaylist": (id: PlaylistID) => Result<number, string>;
  "queue::saveAsPlaylist": (name: string) => Result<PlaylistID, string>;

  "playlist::getAll": () => PlaylistInfo[];
  "playlist::create": (name: string) => Result<PlaylistID, string>;
  "playlist::rename": (id: PlaylistID, name: string) => Result<void, string>;
  "playlist::delete": (id: PlaylistID) => void;
  "playlist::addSong": (id: PlaylistID, song: ResourceID) => Result<void, string>;
  "playlist::removeSong": (id: PlaylistID, song: ResourceID) => void;

  "dir::select": () => Optional<OsuDirectory>;
  "dir::autoGetOsuDirs": () => Optional<OsuDirectory[]>;
  "dir::submit": (dir: OsuDirectory) => void;

  "discord::play": (song: Song, length: number, duration: number) => void;
  "discord::pause": (song: Song) => void;

  "error::dismissed": () => void;

  "parse::search": (query: string) => SearchQuery;
  "parse::template": (template: string) => ConfigSuccess | ConfigError;

  "settings::write": <K extends keyof Settings>(key: K, value: any) => void;
  "settings::get": <K extends keyof Settings>(key: K) => Optional<any>;
  "settings::DeleteSongData": () => void;

  "app::restart": () => void;

  "os::platform": () => NodeJS.Platform;

  "window::close": () => void;
  "window::minimize": () => void;
  "window::maximize": () => void;
  "window::isMaximized": () => boolean;

  "query::songsPool::init": (payload: SongsQueryPayload) => InfiniteScrollerInitResponse;
  "query::songsPool": (
    request: InfiniteScrollerRequest,
    payload: SongsQueryPayload,
  ) => InfiniteScrollerResponse<Song>;
  "query::queue::init": () => InfiniteScrollerInitResponse;
  "query::queue": (request: InfiniteScrollerRequest) => InfiniteScrollerResponse<Song>;

  "save::localVolume": (volume: number, song: ResourceID) => void;

  "save::songColors": (primaryColor: string, secondaryColor: string, song: ResourceID) => void;

  "dev::storeLocation": () => string;
};

export type ListenAPI = {
  changeScene: (scene: Scenes) => void;

  "loadingScene::setTitle": (title: string) => void;
  "loadingScene::update": (update: LoadingSceneUpdate) => void;

  "error::setMessage": (msg: string) => void;

  "queue::songChanged": (song: Song) => void;
  "queue::created": () => void;
  "queue::destroyed": () => void;

  "songView::reset": () => void;

  "playlist::changed": () => void;

  "window::maximizeChange": (maximized: boolean) => void;

  notify: (notice: NoticeTypeIconMap) => void;
};
