// Stage M: playing a friend online, without a network. A host session and a guest session joined by an in-memory
// link play whole seeded matches. The host runs the real game and checks every action; the guest only ever
// receives its own view and redacted events. (Ported from the old game's tests/online.test.js.)
import { test, run, assert } from './helpers.js';
import { defineCards } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { actor, legalActions } from '../src/engine/game.js';
import { viewFor } from '../src/engine/view.js';
import { chooseAction } from '../src/ai/ai.js';
import { makeRng } from '../src/engine/random.js';
import { HostSession, GuestSession, linkPair } from '../src/net/session.js';
import { roomCode, normalizeCode, peerId, inviteLink, decode, encode, CODE_LETTERS, PROTOCOL, HOST_SEAT, GUEST_SEAT } from '../src/net/protocol.js';
import { iceServers, STUN_SERVERS } from '../src/net/ice.js';

defineCards(CARDS);
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });
const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

test('room codes, invite links, messages and ICE servers', async () => {
  let n = 0;
  const codes = Array.from({ length: 200 }, () => roomCode(() => ((n = (n * 9301 + 49297) % 233280) / 233280)));
  assert.ok(codes.every((c) => /^[A-Z]{5}$/.test(c) && ![...c].some((ch) => 'ILOUVBSZ01'.includes(ch))), 'no look-alike letters');
  assert.ok(![...CODE_LETTERS].some((ch) => 'AEIOUCFK'.includes(ch)), 'no vowels (or C, F, K): codes never spell words');
  assert.ok(new Set(codes).size > 190, 'codes vary');
  assert.equal(normalizeCode(' hmq-xt '), 'HMQXT', 'typed codes are forgiving');
  assert.equal(normalizeCode('HMQX'), null);
  assert.equal(normalizeCode('HMQXA'), null, 'not a code letter');
  assert.equal(peerId('HMQXT'), 'untitled-fantasy-tcg-hmqxt');
  assert.equal(inviteLink('https://elibarrett11.github.io/UntitledTCG/?seed=3#x', 'HMQXT'), 'https://elibarrett11.github.io/UntitledTCG/?join=HMQXT');
  assert.equal(inviteLink('http://127.0.0.1:8000/?peerserver=127.0.0.1:9000', 'HMQXT'), 'http://127.0.0.1:8000/?join=HMQXT&peerserver=127.0.0.1%3A9000');
  assert.deepEqual(decode(encode('action', { id: 1 })), { p: PROTOCOL, t: 'action', id: 1 });
  assert.equal(decode('not json'), null);
  assert.deepEqual(decode(JSON.stringify({ p: PROTOCOL + 1, t: 'hello', build: 'x' })), { t: 'hello', build: 'x', otherProtocol: PROTOCOL + 1 });
  assert.deepEqual(await iceServers(), STUN_SERVERS, 'no TURN key: STUN only');
  assert.ok(STUN_SERVERS.every((s) => s.urls.startsWith('stun:stun')));
});

// A host and a guest, connected, on match setup.
async function connect({ hostBuild = 'B', guestBuild = 'B', seed = 31, token = 'tok-1' } = {}) {
  const [hostLink, guestLink] = linkPair();
  const log = { host: [], guest: [], snapshots: [], guestViews: [], syncs: [], gone: 0, back: 0, left: 0, clocks: [] };
  const host = new HostSession(hostLink, {
    build: hostBuild, seed,
    listener: {
      status: (s) => log.host.push(`status:${s}`),
      start: (state) => { log.snapshots[0] = state; },
      update: (prev, next) => { log.snapshots.push(next); },
      friendGone: () => { log.gone += 1; }, back: () => { log.back += 1; }, left: () => { log.left += 1; },
    },
  });
  const guest = new GuestSession(guestLink, {
    build: guestBuild, token, timer: 8,
    listener: {
      status: (s) => log.guest.push(`status:${s}`),
      start: (view) => log.guestViews.push({ seq: 0, view }),
      update: (prev, next) => log.guestViews.push({ seq: guest.seq, view: next }),
      rejected: (message) => log.guest.push(`rejected:${message}`),
      sync: (info) => log.syncs.push(info),
      clock: (left, total) => log.clocks.push([left, total]),
      left: () => { log.left += 1; },
    },
  });
  await flush();
  return { host, guest, hostLink, guestLink, log };
}

// Plays on with the AI choosing for both seats (the guest's moves go over its link) until `until` says stop. The
// guest Reacts whenever it can, the first `reactFirst` times (so a React window where the guest reacts is played).
async function playOn(host, guest, rng, { until = () => false, reactFirst = 0 } = {}) {
  let guestActions = 0;
  let reacts = 0;
  for (let guard = 0; guard < 6000 && host.state.phase !== 'gameOver' && !until(); guard++) {
    const s = host.state;
    const who = actor(s);
    assert.ok(who, `someone can act (${s.phase})`);
    let action = chooseAction(s, who, rng);
    if (who === GUEST_SEAT && reacts < reactFirst && s.reactWindow?.reactor === GUEST_SEAT) {
      const react = legalActions(s, GUEST_SEAT).find((a) => a.type === 'react');
      if (react) { action = react; reacts += 1; }
    }
    if (who === GUEST_SEAT) {
      const { who: _w, ...bare } = action;   // (the guest sends no seat: the host takes it as the guest's)
      guest.act(bare);
      guestActions += 1;
    } else host.act(action);
    await flush();
    assert.ok(host.state !== s, `${who}'s action was applied`);
  }
  return { guestActions, reacts };
}

test('a whole match between a host and a guest: a winner, the guest always holding exactly its view, nothing hidden sent', async () => {
  const { host, guest, guestLink, log } = await connect();
  assert.equal(host.status, 'ready', 'connected');
  assert.equal(guest.status, 'ready');
  assert.deepEqual(log.syncs, [{ phase: 'setup' }], 'the guest is told the host is on match setup');
  assert.equal(host.guestTimer, 8, 'the guest\'s React-timer setting reached the host');
  assert.ok(host.begin(), 'the host presses Begin');
  await flush();
  assert.equal(log.guestViews[0].view.phase, 'mulligan');

  // Illegal guest actions, and actions for the host's seat, are refused with nothing changed.
  const before = JSON.stringify(host.state);
  const seq = host.seq;
  guest.act({ type: 'pass' });
  await flush();
  assert.equal(host.seq, seq);
  assert.match(log.guest.at(-1), /^rejected:/);
  // (Acting for the host: the host takes every guest action as the guest's own, whatever seat it names.)
  if (actor(host.state) === HOST_SEAT) {
    guest.act({ type: 'mulligan', who: HOST_SEAT, cards: [] });
    await flush();
    assert.equal(host.seq, seq, 'the guest can\'t take the host\'s mulligan');
    assert.match(log.guest.at(-1), /^rejected:/);
  }
  guest.act(null);
  await flush();
  assert.match(log.guest.at(-1), /^rejected:Not an action/);
  assert.equal(JSON.stringify(host.state), before, 'nothing changed');

  const { guestActions, reacts } = await playOn(host, guest, makeRng(31), { reactFirst: 3 });
  assert.equal(host.state.phase, 'gameOver', 'the match was played to the end');
  assert.ok(host.state.winner, 'it has a winner');
  assert.ok(guestActions > 20);
  assert.ok(reacts >= 1, 'the guest Reacted in a React window');

  // After every action, from either player, the guest had exactly viewFor(hostState, guest), events included.
  assert.deepEqual(guest.view, viewFor(host.state, GUEST_SEAT));
  assert.equal(guest.seq, host.seq);
  assert.equal(log.guestViews.length, log.snapshots.length);
  for (const { seq: k, view } of log.guestViews) assert.deepEqual(view, viewFor(log.snapshots[k], GUEST_SEAT), `seq ${k}`);
  assert.ok(log.guestViews.some(({ view }) => view.events.some((e) => e.type === 'react' && e.who === GUEST_SEAT)), 'the guest\'s React was shown');

  // No message to the guest held the RNG, a Draw Pile card, a card in the host's hand or a face-down Strat.
  let updates = 0;
  for (const text of guestLink.received) {
    const m = JSON.parse(text);
    if (m.view) assert.equal(m.view.rng, 0, 'no random-number state');
    if (m.t !== 'update') continue;
    updates += 1;
    const real = log.snapshots[m.seq];
    const secret = [...real.players[HOST_SEAT].hand, ...real.players.p1.drawPile, ...real.players.p2.drawPile, ...real.strats.filter((x) => x.owner === HOST_SEAT).map((x) => x.card)];
    for (const c of secret) assert.ok(!text.includes(`"${c.uid}"`), `seq ${m.seq}: ${c.uid} was sent`);
    assert.ok(!text.includes(`"rng":${real.rng}`) || real.rng === 0);
  }
  assert.ok(updates > 50);
  const sizes = guestLink.received.map((t) => t.length);
  console.log(`  ${host.seq} updates, ${guestActions} guest actions, ${reacts} guest Reacts; largest message ${Math.round(Math.max(...sizes) / 1024)} KB, average ${Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024)} KB.`);
  assert.ok(Math.max(...sizes) < 200 * 1024, 'messages stay small');

  // A rematch: both must accept, then back to match setup with a new seed.
  const firstSeed = host.seed;
  let asked = 0;
  host.on.rematchAsked = () => { asked += 1; };
  guest.requestRematch();
  await flush();
  assert.equal(asked, 1, 'the host sees the guest wants a rematch');
  assert.equal(host.state.phase, 'gameOver', 'not until both accept');
  host.requestRematch();
  await flush();
  assert.equal(host.state, null, 'both accepted: back to match setup');
  assert.equal(guest.view, null);
  assert.notEqual(host.seed, firstSeed, 'a new seed: a new shuffle and initiative');
  host.begin();
  await flush();
  assert.equal(host.state.phase, 'mulligan');
  assert.deepEqual(guest.view, viewFor(host.state, GUEST_SEAT));
});

test('the guest\'s React countdown follows the host\'s clock', async () => {
  const { host, guest, log } = await connect({ seed: 5 });
  host.begin();
  await flush();
  await playOn(host, guest, makeRng(5), { until: () => host.state.reactWindow?.reactor === GUEST_SEAT });
  assert.equal(host.state.reactWindow?.reactor, GUEST_SEAT);
  host.clock(5000, 8000);
  await flush();
  assert.deepEqual(log.clocks.at(-1), [5000, 8000]);
  // Time runs out on the host's clock: the host lets it happen for the guest.
  const seq = host.seq;
  host.apply({ type: 'decline' }, GUEST_SEAT);
  await flush();
  assert.equal(host.seq, seq + 1);
  assert.equal(guest.seq, host.seq);
  host.clock(1000, 8000);   // (a late tick for an old window: the guest ignores... it's for the current seq)
  await flush();
});

test('a different version blocks the match, on both sides', async () => {
  const { host, guest } = await connect({ hostBuild: 'M', guestBuild: 'G' });
  assert.equal(host.status, 'mismatch');
  assert.equal(guest.status, 'mismatch', 'both see it');
  assert.equal(host.begin(), false, 'the match does not start');
  const [hostLink, guestLink] = linkPair();
  const h = new HostSession(hostLink, { build: 'B' });
  guestLink.listen(() => {});
  guestLink.send(JSON.stringify({ p: PROTOCOL + 1, t: 'hello', build: 'B' }));
  await flush();
  assert.equal(h.status, 'mismatch', 'a different protocol is a different version too');
});

test('a hello lost as the connection opens doesn\'t stall it', async () => {
  const [hostLink, guestLink] = linkPair();
  const send = hostLink.send.bind(hostLink);
  let dropped = 0;
  hostLink.send = (text) => (dropped++ ? send(text) : undefined);   // the host's first message never arrives
  const host = new HostSession(hostLink, { build: 'B' });
  await flush();
  const guest = new GuestSession(guestLink, { build: 'B' });
  await flush();
  assert.equal(guest.status, 'ready', 'the host answered the guest\'s hello');
  assert.equal(host.status, 'ready');
});

test('the guest drops mid-match and comes back with its token: the same view, and play goes on to the end', async () => {
  const { host, guest: first, guestLink, log } = await connect({ seed: 41 });
  host.begin();
  await flush();
  const rng = makeRng(41);
  await playOn(host, first, rng, { until: () => host.state.round === 3 && actor(host.state) === HOST_SEAT && !host.state.reactWindow });
  guestLink.drop();
  assert.equal(log.gone, 1, 'the host sees the guest go');
  assert.equal(host.link, null, 'and keeps the match');
  // The host stays usable: while it's the host's move, it plays on.
  let hostMoves = 0;
  while (actor(host.state) === HOST_SEAT && host.state.phase === 'battle' && hostMoves < 3) { host.act(chooseAction(host.state, HOST_SEAT, rng)); hostMoves += 1; }
  // The guest refreshes: a new session, the same token (kept in its browser), a new link.
  const [h2, g2] = linkPair();
  const syncs = [];
  const guest = new GuestSession(null, { build: 'B', token: 'tok-1', listener: { sync: (info) => syncs.push(info) } });
  host.offer(h2);
  guest.attach(g2);
  await flush();
  assert.equal(log.back, 1, 'the host sees the guest come back');
  assert.equal(syncs.at(-1).phase, 'match');
  assert.deepEqual(guest.view, viewFor(host.state, GUEST_SEAT), 'the guest has the current view');
  assert.equal(guest.seq, host.seq);
  await playOn(host, guest, rng);
  assert.equal(host.state.phase, 'gameOver');
  assert.deepEqual(guest.view, viewFor(host.state, GUEST_SEAT));
});

test('messages arriving on a link after it dropped are ignored safely', async () => {
  const { host, guest, hostLink, guestLink } = await connect({ seed: 43 });
  host.begin();
  await flush();
  const seq = host.seq;
  guestLink.drop();
  hostLink.inject(encode('action', { id: 99, action: { type: 'mulligan', cards: [] } }));
  hostLink.inject('not even json');
  assert.equal(host.seq, seq, 'a late guest action changes nothing');
  guestLink.inject(encode('update', { seq: guest.seq + 1, who: HOST_SEAT, view: { junk: true }, logFrom: 0, log: [] }));
  guestLink.inject(encode('leave'));
  assert.notDeepEqual(guest.view, { junk: true, log: [] }, 'a late host update is ignored');
  assert.equal(guest.ended, false, 'a late leave is ignored');
  assert.equal(guest.act({ type: 'pass' }), null, 'no actions while disconnected');
});

test('a stranger with the room code is told the match already has two players', async () => {
  const { host, guest } = await connect({ seed: 44 });
  host.begin();
  await flush();
  const [h2, g2] = linkPair();
  let full = 0;
  const stranger = new GuestSession(null, { build: 'B', token: 'someone-else', listener: { full: () => { full += 1; } } });
  host.offer(h2);
  stranger.attach(g2);
  await flush();
  await wait(250);
  assert.equal(full, 1, 'turned away');
  assert.equal(stranger.view, null, 'and shown nothing');
  assert.equal(host.status, 'ready');
  // The real guest plays on.
  await playOn(host, guest, makeRng(44), { until: () => host.seq > 6 });
  assert.ok(host.seq > 6);
});

test('the host is saved and restored after a refresh: an identical state, and the match ends exactly as without it', async () => {
  const reference = await connect({ seed: 45 });
  reference.host.begin();
  await flush();
  await playOn(reference.host, reference.guest, makeRng(45));
  const finalRef = JSON.stringify(reference.host.state);

  const { host, guest, guestLink } = await connect({ seed: 45 });
  host.begin();
  await flush();
  const rng = makeRng(45);
  await playOn(host, guest, rng, { until: () => host.state.round === 4 });
  const saved = JSON.parse(JSON.stringify(host.save()));   // (through localStorage: JSON)
  host.close();          // the host's page goes away
  guestLink.drop();
  assert.equal(HostSession.restore(saved, { build: 'other' }), null, 'a save from another version is not resumed');
  const restored = HostSession.restore(saved, { build: 'B' });
  assert.equal(JSON.stringify(restored.state), JSON.stringify(host.state), 'restored: an identical state');
  assert.equal(restored.seq, host.seq);
  // The guest reconnects to the restored host (the same room code, the same token).
  const [h2, g2] = linkPair();
  restored.offer(h2);
  guest.attach(g2);
  await flush();
  assert.deepEqual(guest.view, viewFor(restored.state, GUEST_SEAT));
  await playOn(restored, guest, rng);
  assert.equal(JSON.stringify(restored.state), finalRef, 'the match ends exactly as it would have without the refresh');
});

test('leave match: the other player is told, and nothing more happens', async () => {
  const { host, guest, log } = await connect({ seed: 46 });
  host.begin();
  await flush();
  guest.leave();
  await flush();
  assert.equal(log.left, 1, 'the host is told the guest left');
  assert.ok(host.ended && guest.ended);
  assert.throws(() => host.act({ type: 'mulligan', cards: [] }), /ended/);
  const again = await connect({ seed: 47 });
  again.host.leave();
  await flush();
  assert.equal(again.log.left, 1, 'the guest is told the host left');
});

run('online');
