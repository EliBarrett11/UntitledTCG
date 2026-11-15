// The page: a match against the AI on the first deck (?seed=N to replay one; ?debug=1 for the text-log
// debug match). Dev aids: ?pace=ms (the AI's pause per action), ?scene=mid|react|lastbattle|quest|end,
// ?sheet=full|all (every card, for the contact sheet and the neat-text test), ?prefer=card:mode,... (the autoplay
// AI makes those plays when legal: for the review clips), ?autoplay=1, ?speed, ?lowmotion, ?webgl=0, ?fps=1.
import { GAME } from '../engine/vocab.js';

const params = new URLSearchParams(location.search);
document.title = GAME.title;

if (params.has('sheet')) {
  import('./sheet.js').then((m) => m.runSheet(params));
} else if (params.get('debug') === '1') {
  import('./debug.js').then((m) => m.runDebugView(params));
} else {
  import('./app.js').then((m) => m.startApp(params));
}
