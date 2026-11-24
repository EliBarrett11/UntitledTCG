// Stage X1: the dev scenes and aids work only with ?dev in the address. Without it they're dropped, so a player's link
// always opens the real game. (Players' own parameters stay: ?seed=N, ?join=CODE, ?speed, ?lowmotion and ?fps.)
export const DEV_PARAMS = ['scene', 'hand', 'sheet', 'debug', 'prefer', 'autoplay', 'pace', 'timer', 'vfxquality', 'webgl', 'fx', 'skip', 'title',
  'screen', 'lobby', 'libpage', 'libfrom', 'libfilter', 'libdeck', 'libcode', 'seat', 'from', 'series', 'round', 'peerserver'];

// The page's parameters as the game sees them (a URLSearchParams, or a query string).
export function gameParams(search) {
  const params = new URLSearchParams(search);
  if (!params.has('dev')) for (const k of DEV_PARAMS) params.delete(k);
  return params;
}
export const isDev = (search) => new URLSearchParams(search).has('dev');
