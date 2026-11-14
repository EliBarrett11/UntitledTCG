// The page: a match against the AI on the first deck (?seed=N to replay one; ?debug=1 for the text-log
// debug match). Dev aids: ?pace=ms (the AI's pause per action), ?scene=mid|react|lastbattle|end,
// ?sheet=full|all (every card, for the contact sheet and the neat-text test).
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
