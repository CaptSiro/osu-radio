import { Router } from "@main/lib/route-pass/Router";
import { querySongs } from "@main/lib/song/query";
import { none, some } from "@shared/lib/rust-types/Optional";

Router.respond("query::songsPool::init", (_evt, payload) => {
  return some({
    initialIndex: 0,
    count: querySongs(payload).length,
  });
});

const BUFFER_SIZE = 50;

Router.respond("query::songsPool", (_evt, request, payload) => {
  // Similar as for queue list pagination. Song pool is simpler that the direction may only be down

  if (request.direction === "up") {
    return none();
  }

  // Cached between pages of the same query
  const songs = querySongs(payload);

  if (request.index * BUFFER_SIZE >= songs.length) {
    return none();
  }

  return some({
    index: request.index + 1,
    total: songs.length,
    items: songs.slice(request.index * BUFFER_SIZE, (request.index + 1) * BUFFER_SIZE),
  });
});
