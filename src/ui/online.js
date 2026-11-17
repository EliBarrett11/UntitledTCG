// Playing a friend online, on screen (stage M; ported from the old game's src/online.js, Multiplayer M2 and M3).
//
// One player hosts (a room code and an invite link), the other joins. Both see match setup; the host presses Begin.
// The host's session holds the real game; each update from it, from either player's action, is handed to the app,
// which plays it through the normal presentation, one after another.
//
// Robustness:
//   - The guest dropping or refreshing: the host keeps the match ("Your friend disconnected — waiting for them to
//     reconnect…") and stays usable. The guest's browser keeps a reconnect token for the room; reopening the invite
//     link (or a dropped connection retrying by itself every few seconds) rejoins and carries on.
//   - The host refreshing: the host's browser saves the whole match after every action; the title screen offers
//     "Resume your match with your friend", which re-opens the same room code, so the friend's link still works.
//   - Leave match, either side: the other is told and goes back to the title screen.
//   - After a match: Rematch, which both must accept; then match setup again, with a new seed.
//   - A connection light (green / amber / red), and plain words when a connection can't be made.
//
// app (from src/ui/app.js): { draw(), screen(name), start(game), update(prev, next, who), clock(left, total),
//   rejected(message), toTitle(notice), reactSeconds() }.
import { HostSession, GuestSession, newToken } from '../net/session.js';
import { HOST_SEAT, GUEST_SEAT, normalizeCode, inviteLink } from '../net/protocol.js';
import { esc } from './text.js';

// The game's version for playing a friend: both browsers must have the same one. Change it whenever the rules,
// the cards or the messages change, so an old page and a new one never play each other.
export const BUILD = 'Stage M · play a friend online';

// --- Saved in this browser (guarded: storage can be missing or blocked) ---------------------------------------------
const HOST_KEY = 'utcg-online-host';
const tokenKey = (code) => `utcg-online-guest-${code}`;
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Not saved: play goes on, only resuming after a refresh doesn't. */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* Nothing to do. */ } },
};

// The match this browser was hosting, if this version can resume it.
export function savedHostMatch() {
  const saved = store.get(HOST_KEY);
  if (!saved?.code || saved.session?.build !== BUILD || saved.session?.state?.phase === 'gameOver') return null;
  return { code: saved.code, round: saved.session.state?.round ?? 0, started: Boolean(saved.session.state) };
}
export const forgetHostMatch = () => store.remove(HOST_KEY);

// The network code is loaded only when playing a friend.
const peer = () => import('../net/peer.js');

export function createOnline(app) {
  let net = null;   // the online match in progress

  function begin(role) {
    net?.room?.cancel?.();
    net = {
      role, seat: role === 'host' ? HOST_SEAT : GUEST_SEAT, kind: 'connecting', code: null, link: null, session: null, room: null,
      health: 'reconnecting', banner: null, toast: null, rematch: 'ask', everConnected: false, retry: null, message: null, copied: false, inMatch: false,
    };
    return net;
  }
  const lobby = (kind, extra = {}) => { Object.assign(net, { kind }, extra); app.screen('lobby'); };

  function watch(link) {
    link.onHealth?.((h) => {
      if (!net || net.session?.link !== link) return;
      net.health = h;
      app.draw();
    });
  }
  function toast(text) {
    if (!net) return;
    net.toast = text;
    app.draw();
    setTimeout(() => { if (net?.toast === text) { net.toast = null; app.draw(); } }, 3000);
  }

  // --- Hosting ------------------------------------------------------------------------------------------------
  function hostNew(seed) {
    const me = begin('host');
    me.session = new HostSession(null, { build: BUILD, seed, listener: hostListener() });
    lobby('hosting');
    openRoom(null);
  }

  // After a refresh: the saved match, the same room code.
  function hostResume() {
    const saved = store.get(HOST_KEY);
    const me = begin('host');
    const session = saved && HostSession.restore(saved.session, { build: BUILD, listener: hostListener() });
    if (!session) { forgetHostMatch(); net = null; app.toTitle('That match can\'t be resumed (the game has been updated since). Start a new one.'); return; }
    me.session = session;
    me.code = saved.code;
    me.link = inviteLink(location.href, saved.code);
    me.everConnected = true;
    if (session.state) {
      me.inMatch = true;
      me.banner = 'Waiting for your friend to reconnect…';
      me.health = 'lost';
      app.start(session.state);
    } else lobby('waiting', { gone: true });
    openRoom(saved.code);
  }

  function openRoom(code) {
    const me = net;
    peer().then(({ hostRoom }) => hostRoom({
      code: (opened) => {
        if (net !== me) return;
        me.code = opened;
        me.link = inviteLink(location.href, opened);
        save();
        if (me.kind === 'hosting') lobby('waiting');
        else app.draw();
      },
      connected: (link) => {
        if (net !== me) { link.close(); return; }
        watch(link);
        me.session.offer(link);
      },
      error: (message) => {
        if (net !== me) return;
        if (me.inMatch) { me.health = 'lost'; me.banner = message; app.draw(); } else lobby('error', { message, retry: 'host' });
      },
    }, { code })).then((room) => { if (net === me) me.room = room; else room.cancel(); })
      .catch((err) => { if (net === me) lobby('error', { message: err.message, retry: 'host' }); });
  }

  function save() {
    if (net?.role === 'host' && net.code && !net.session.ended) store.set(HOST_KEY, { code: net.code, session: net.session.save(), savedAt: Date.now() });
  }

  function hostListener() {
    return {
      status: (st) => {
        const me = net;
        if (!me) return;
        if (st === 'mismatch') lobby('mismatch');
        else if (st === 'ready') {
          me.health = 'good';
          me.everConnected = true;
          if (!me.session.state) { me.kind = 'setup'; app.screen('setup'); }
        }
        queueMicrotask(app.draw);
      },
      friendGone: () => {
        const me = net;
        if (!me) return;
        me.health = 'lost';
        if (me.inMatch) { me.banner = 'Your friend disconnected — waiting for them to reconnect…'; app.draw(); } else lobby('waiting', { gone: true });
      },
      back: () => {
        net.banner = null;
        net.health = 'good';
        toast('Your friend reconnected');
      },
      start: (game) => { net.inMatch = true; net.rematch = 'ask'; save(); app.start(game); },
      update: (prev, next, who) => { save(); app.update(prev, next, who); },
      rematchAsked: () => { if (!net.session.wantRematch) net.rematch = 'accept'; save(); app.draw(); },
      again: () => backToSetup(),
      left: () => friendLeft(),
    };
  }

  // --- Joining -----------------------------------------------------------------------------------------------
  function join(typed) {
    const code = normalizeCode(typed);
    const me = begin('guest');
    if (!code) { lobby('join', { message: typed ? `"${typed}" isn't a room code: it's 5 letters, like HMQXT.` : null }); return; }
    me.code = code;
    // The reconnect token for this room, kept in this browser: reopening the invite link carries on the match.
    let token = store.get(tokenKey(code));
    if (!token) { token = newToken(); store.set(tokenKey(code), token); }
    me.session = new GuestSession(null, { build: BUILD, token, timer: app.reactSeconds(), listener: guestListener() });
    lobby('connecting');
    connectGuest();
  }

  function connectGuest() {
    const me = net;
    if (!me || me.connecting || me.session.ended) return;
    me.connecting = true;
    peer().then(({ joinRoom }) => joinRoom(me.code, {
      connected: (link) => {
        me.connecting = false;
        if (net !== me) { link.close(); return; }
        watch(link);
        me.session.attach(link);
      },
      error: (message) => {
        me.connecting = false;
        if (net !== me || me.session.ended) return;
        if (me.everConnected) {
          // Once connected, keep trying quietly: the host may be refreshing, or a network blinking.
          clearTimeout(me.retry);
          me.retry = setTimeout(connectGuest, 3000);
        } else lobby('error', { message, retry: me.code });
      },
    })).then((room) => { if (net === me) me.room = room; else room.cancel(); })
      .catch((err) => { me.connecting = false; if (net === me) lobby('error', { message: err.message, retry: me.code }); });
  }

  function guestListener() {
    return {
      status: (st) => {
        const me = net;
        if (!me) return;
        if (st === 'mismatch') lobby('mismatch');
        else if (st === 'ready') { me.health = 'good'; me.everConnected = true; clearTimeout(me.retry); }
        queueMicrotask(app.draw);
      },
      sync: (info) => {
        const me = net;
        const wasAway = me.banner !== null;
        me.banner = null;
        if (info.phase === 'match') {
          me.rematch = me.session.friendRematch ? 'accept' : 'ask';
          me.inMatch = true;
          app.start(info.view, { resume: true });
        } else {
          me.inMatch = false;
          me.kind = 'setup';
          app.screen('setup');
        }
        if (wasAway) toast('Host reconnected');
      },
      friendGone: () => {
        const me = net;
        if (!me) return;
        me.health = 'reconnecting';
        me.banner = 'Your friend disconnected — trying to reconnect…';
        if (!me.inMatch) lobby('connecting', { again: true }); else app.draw();
        clearTimeout(me.retry);
        me.retry = setTimeout(connectGuest, 1500);
      },
      start: (view) => { net.inMatch = true; net.rematch = 'ask'; app.start(view); },
      update: (prev, next, who) => app.update(prev, next, who),
      clock: (left, total) => app.clock(left, total),
      rejected: (message) => app.rejected(message),
      full: () => { store.remove(tokenKey(net.code)); lobby('full'); },
      rematchAsked: () => { if (!net.session.wantRematch) net.rematch = 'accept'; app.draw(); },
      again: () => backToSetup(),
      left: () => friendLeft(),
    };
  }

  // --- During and after a match ----------------------------------------------------------------------------------
  // An action from this screen: the host applies it (checked like any action); the guest sends it to the host.
  // Returns false if it couldn't be sent.
  function act(action) {
    const me = net;
    if (!me?.session) return false;
    const { who, ...bare } = action;
    if (me.role === 'host') { me.session.act(bare); return true; }
    return me.session.act(bare) !== null;
  }
  // The host's clock for the guest's React window.
  const clock = (left, total) => net?.role === 'host' && net.session.clock(left, total);
  const declineForGuest = () => net?.role === 'host' && net.session.apply({ type: 'decline' }, GUEST_SEAT);

  function beginMatch() {
    if (net?.role === 'host') net.session.begin();
  }
  function rematch() {
    if (!net?.session) return;
    net.rematch = 'waiting';
    net.session.requestRematch();
    save();
    app.draw();
  }
  function backToSetup() {
    const me = net;
    Object.assign(me, { kind: 'setup', inMatch: false, rematch: 'ask', banner: null });
    save();
    app.screen('setup');
  }
  // Leave match (or leave the lobby): the friend is told; back to the title screen.
  function leave({ ask = true } = {}) {
    const me = net;
    if (!me) return;
    if (ask && me.inMatch && me.session?.state?.phase !== 'gameOver' && me.session?.view?.phase !== 'gameOver' && !confirm('Leave this match? Your friend will be told you left.')) return;
    me.session?.leave();
    end(me);
    app.toTitle();
  }
  function friendLeft() {
    const me = net;
    end(me);
    app.toTitle('Your friend left the match.');
  }
  function end(me) {
    clearTimeout(me.retry);
    me.room?.cancel?.();
    if (me.role === 'host') forgetHostMatch();
    else if (me.code) store.remove(tokenKey(me.code));
    net = null;
  }

  async function copy() {
    if (!net?.link) return;
    try { await navigator.clipboard.writeText(net.link); } catch {
      const el = document.querySelector('.lobby-link');
      el?.select?.();
      try { document.execCommand?.('copy'); } catch { /* Shown, at least: it can be copied by hand. */ }
    }
    net.copied = true;
    app.draw();
  }

  // Dev aid for the layout check and screenshots (?lobby=…): a lobby screen drawn with sample words; nothing connects.
  function preview(kind) {
    const host = !['join', 'connecting', 'setup-guest', 'full'].includes(kind);
    const me = begin(host ? 'host' : 'guest');
    me.preview = true;
    me.code = 'HMQXT';
    me.link = 'https://elibarrett11.github.io/UntitledTCG/?join=HMQXT';
    me.health = 'good';
    if (kind.startsWith('setup')) { me.kind = 'setup'; me.everConnected = true; return 'setup'; }
    me.kind = kind;
    if (kind === 'error') { me.message = 'Couldn\'t connect. Some networks (offices, schools, some mobile hotspots) block direct connections. Try another network, or see "If your friend can\'t connect" in the README to add a free relay server.'; me.retry = 'HMQXT'; }
    if (kind === 'join') me.message = '"HMQX" isn\'t a room code: it\'s 5 letters, like HMQXT.';
    return 'lobby';
  }

  return {
    preview,
    hostNew, hostResume, join, act, clock, declineForGuest, beginMatch, rematch, leave, copy,
    active: () => Boolean(net),
    get role() { return net?.role ?? null; },
    get state() { return net; },
    // The guest's React-timer setting, for the host's clock (seconds), or null.
    guestTimer: () => net?.session?.guestTimer ?? null,
    retry: () => { const r = net?.retry; if (r === 'host') hostNew(Date.now() >>> 0); else if (r) join(r); },
    // Closing the tab: the link closes (the host's match stays saved for a resume).
    goodbye: () => net?.session?.link?.close?.(),
  };
}

// --- The lobby screens, in the title screen's look -----------------------------------------------------------------
const btn = (act, label, cls = '') => `<button type="button" class="scr-btn ${cls}" data-act="${act}" data-nav>${esc(label)}</button>`;

const joinForm = (label) => `<form class="lobby-form" data-region="join-form"><label class="lobby-p">${esc(label)}</label>
  <div class="lobby-linkrow"><input class="lobby-input" name="code" maxlength="8" autocomplete="off" spellcheck="false" placeholder="HMQXT" aria-label="Room code">
  <button type="submit" class="scr-btn small" data-nav>Join</button></div></form>`;

export function lobbyScreen(net) {
  const k = net?.kind ?? 'join';
  let body = '';
  if (k === 'hosting') {
    body = `<div class="lobby-h">PLAY A FRIEND</div><p class="lobby-p">Opening a room…</p>${btn('net-leave', 'Back')}`;
  } else if (k === 'waiting') {
    body = `<div class="lobby-h">PLAY A FRIEND</div>
      <div class="lobby-k">YOUR ROOM CODE</div>
      <div class="lobby-code" data-region="room-code">${esc(net.code ?? '')}</div>
      <div class="lobby-k">INVITE LINK</div>
      <div class="lobby-linkrow"><input class="lobby-link" readonly value="${esc(net.link ?? '')}" aria-label="Invite link">${btn('net-copy', net.copied ? 'Copied' : 'Copy', 'primary small')}</div>
      <p class="lobby-wait">${net.gone ? 'Your friend left the room — waiting for them to come back…' : 'Waiting for your friend to join…'}</p>
      <p class="lobby-p">Send your friend the link, or tell them the code: they open the game, choose Play a friend and type it.</p>
      ${net.gone ? '' : joinForm('Got a code from a friend?')}
      ${btn('net-leave', 'Leave')}`;
  } else if (k === 'join') {
    body = `<div class="lobby-h">PLAY A FRIEND</div>
      ${joinForm('Type the room code your friend sent you.')}
      ${net?.message ? `<p class="lobby-err">${esc(net.message)}</p>` : ''}
      ${btn('net-host', 'Host a match instead')}
      ${btn('net-leave', 'Back')}`;
  } else if (k === 'connecting') {
    body = `<div class="lobby-h">PLAY A FRIEND</div>
      <div class="lobby-code small">${esc(net.code ?? '')}</div>
      <p class="lobby-wait">${net.again ? 'Your friend disconnected — trying to reconnect…' : 'Connecting to your friend…'}</p>${btn('net-leave', 'Leave')}`;
  } else if (k === 'error') {
    body = `<div class="lobby-h">COULDN'T CONNECT</div><p class="lobby-err">${esc(net.message ?? 'Something went wrong with the connection.')}</p>
      ${net.retry ? btn('net-retry', 'Try again', 'primary') : ''}${btn('net-leave', 'Back')}`;
  } else if (k === 'mismatch') {
    body = `<div class="lobby-h">DIFFERENT VERSIONS</div>
      <p class="lobby-err">Your friend is on a different version of the game. Both of you refresh the page (to get the latest version), then try again.</p>
      ${btn('net-leave', 'Back')}`;
  } else if (k === 'full') {
    body = `<div class="lobby-h">ROOM FULL</div><p class="lobby-err">This match already has two players.</p>${btn('net-leave', 'Back')}`;
  }
  return `<div class="screen screen-title screen-lobby" data-region="lobby">
    <div class="title-art" aria-hidden="true"></div>
    <div class="title-shade" aria-hidden="true"></div>
    <div class="lobby-panel">${body}</div>
  </div>`;
}

// The connection light (top right), the banner and a short piece of news, over the match.
export function netOverlay(net) {
  if (!net?.everConnected && !net?.inMatch) return '';
  const h = net.health === 'good' ? 'good' : net.health === 'lost' ? 'lost' : 'slow';
  const words = { good: 'Connected to your friend', slow: net.health === 'slow' ? 'The connection is slow' : 'Reconnecting…', lost: 'Disconnected' }[h];
  return `<div class="net-light ${h}" data-region="net-light" title="${words}" role="status" aria-label="${words}"><i></i>${h === 'good' ? '' : `<span>${words}</span>`}</div>
    ${net.banner ? `<div class="net-banner" data-region="net-banner" role="status">${esc(net.banner)}</div>` : ''}
    ${net.toast ? `<div class="net-toast" role="status">${esc(net.toast)}</div>` : ''}`;
}
