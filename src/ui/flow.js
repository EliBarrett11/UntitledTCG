// The flow between screens (stage V3): title → setup → match → end → setup (Play again) or title. Pure: no DOM.
//
// The page opens on the title screen. The test hooks go straight to a match, so every check still runs:
// ?skip=title, or any of ?seed, ?scene, ?autoplay, ?pace, ?prefer. ?title=1 forces the title first (for the clip
// of the whole flow). ?screen=title|setup opens that screen (the layout check's scenes).
export const SCREENS = ['title', 'setup', 'match', 'end'];
const HOOKS = ['seed', 'scene', 'autoplay', 'pace', 'prefer'];

export function firstScreen(params) {
  const has = (k) => (params?.has ? params.has(k) : k in (params ?? {}));
  const get = (k) => (params?.get ? params.get(k) : params?.[k]);
  if (has('screen') && ['title', 'setup'].includes(get('screen'))) return get('screen');
  if (get('title') === '1') return 'title';
  if (get('skip') === 'title' || HOOKS.some(has)) return 'match';
  return 'title';
}

// Where a button leads from a screen (null: it doesn't move between screens).
const MOVES = {
  title: { play: 'setup' },
  setup: { begin: 'match', 'to-title': 'title', back: 'title' },
  match: { over: 'end' },
  end: { again: 'setup', 'to-title': 'title' },
};
export function nextScreen(screen, act) {
  return MOVES[screen]?.[act] ?? null;
}
