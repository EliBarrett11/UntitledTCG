// The page: the title screen (?seed=N plays a seeded match against the AI). Dev aids, only with ?dev (?dev&debug=1
// for the text-log debug match): ?pace=ms (the AI's pause per action), ?scene=mid|react|lastbattle|quest|end,
// ?sheet=full|all (every card, for the contact sheet and the neat-text test), ?prefer=card:mode,... (the autoplay
// AI makes those plays when legal: for the review clips), ?autoplay=1, ?speed, ?lowmotion, ?webgl=0, ?fps=1.
import { GAME } from '../engine/vocab.js';
import { gameParams } from './devparams.js';

const params = gameParams(location.search);
document.title = GAME.title;

if (params.has('sheet')) {
  import('./sheet.js').then((m) => m.runSheet(params));
} else if (params.get('debug') === '1') {
  import('./debug.js').then((m) => m.runDebugView(params));
} else {
  import('./app.js').then((m) => m.startApp(params));
}
