// The Codex's glossary (stage G). Every entry is made only of sentences quoted word for word from the
// rulebook's settled rules (docs/01-rulebook.md, with its bold and code marks taken off); nothing here is
// written fresh. tests/codex.test.js checks each quote against the rulebook. Pure: no DOM.
//
// An entry: { term, section, quotes: [sentences], see: [other entries' keys] }. `names` lists the words in
// card text and the Codex that link to it (the first is the term itself).

export const GLOSSARY = Object.freeze({
  renown: { term: 'Renown', section: '1, 2', names: ['Renown'], quotes: [
    'The first player to 100 Renown wins, at once, at any moment, even in the middle of an action.',
    'During the Last Battle, all Renown earned is increased by half, rounded up (1 → 2, 3 → 5, 5 → 8).'] },
  warlord: { term: 'Warlord', section: '3', names: ['Warlord'], quotes: [
    "Each player's Warlord sits off the battlefield. It has no Health and takes no space. It can be attacked, and each point of damage to it gives the attacker's player 1 Renown."] },
  lane: { term: 'Lanes', section: '3', names: ['lanes', 'lane'], quotes: ['8 lanes. Each lane has one space per player, facing each other.'] },
  wilds: { term: 'The Wilds', section: '3', names: ['the Wilds', 'Wilds'], quotes: [
    'The Wilds: lanes not covered by a placed Location.',
    'The Wilds are never scored.'], see: ['location'] },
  releasedPile: { term: 'The Released Pile', section: '3', names: ['Released Pile'], quotes: [
    "The Released Pile: where defeated Characters and Monsters go, and cards Released by Events. It's never reshuffled."] },
  drawPile: { term: 'The Draw Pile', section: '5.1', names: ['Draw Pile'], quotes: [
    'Each player draws 7 cards, less one per card they Retained.',
    'When a player must draw from an empty Draw Pile, their Discard Pile is shuffled to make a new one; if both are empty, they draw nothing. (The Released Pile is never used.)'] },
  discardPile: { term: 'The Discard Pile', section: '5.3', names: ['Discard Pile'], quotes: [
    'Each player discards their hand, except Retained cards.',
    'When a player must draw from an empty Draw Pile, their Discard Pile is shuffled to make a new one; if both are empty, they draw nothing.'] },
  round: { term: 'Round', section: '5', names: ['Round'], quotes: ['Each Round has three phases: Dawn, the Battle Phase and Dusk.'] },
  dawn: { term: 'Dawn', section: '5.1', names: ['Dawn'], quotes: [
    'Spent Characters and Monsters become Active.', 'Each player gains 1 Gold.', "Cards off the battlefield take this Round's Level (section 7)."] },
  battlePhase: { term: 'The Battle Phase', section: '5.2', names: ['Battle Phase'], quotes: [
    'Initiative alternates each Round.', 'Players alternate one action per turn (the actions are listed in section 8).', 'Two Passes in a row end the phase.'] },
  dusk: { term: 'Dusk', section: '5.3', names: ['Dusk'], quotes: [
    'Pending Strats resolve, in the order played.', 'Dominance: each placed Location, or the Last Battle, is scored (section 9).', '"Until Dusk" effects end.'] },
  pass: { term: 'Pass', section: '5.2', names: ['Pass'], quotes: [
    'Passing gives the passer +1 Base Energy for this Round, except the Pass that ends the phase.',
    'You can\'t Pass while you have a Ready Character or Monster with unmatched Speed (the opponent has no Active one of the same Speed) that has a legal target.'] },
  energy: { term: 'Energy', section: '6', names: ['Base Energy', 'Energy'], quotes: [
    'Base Energy is the Round number, up to 10. Passing adds 1 (section 5.2), which can go past 10. Unspent Base Energy is lost at the end of the Round.',
    "An action can't be taken if Base Energy plus available Exert is less than its cost."], see: ['exert'] },
  exert: { term: 'Exert', section: '6', names: ['Exert'], quotes: [
    'Exert: extra points beyond Base Energy.', 'The Exert maximum is 1 in Round 1, 2 in Round 2, and 3 from Round 3 on.', 'Exert can only cover a shortfall: Base Energy is spent first.'], see: ['exhaust'] },
  exhaust: { term: 'Exhaust', section: '6', names: ['Exhausted', 'Exhaust'], quotes: [
    'each Exert point spent becomes Exhausted and recovers at a later Dawn, by the fastest free Recovery Position',
    'A position is free again once its point has recovered. Points never move up a position.'] },
  series: { term: 'Series', section: '7', names: ['series'], quotes: [
    'A series: each card is one Character who grows over the match, through up to 6 Levels.',
    'Light series: Levels 1–6. Mid: Levels 2–7. Heavy: Levels 3–8.'] },
  level: { term: 'Level', section: '7', names: ['Levels', 'Level'], quotes: [
    "Levels off the battlefield (hand, Draw Pile and Discard Pile): the series' first Level in Round 1, +1 each Round, up to its maximum.",
    "On the battlefield, a summoned card is a snapshot at the Level it was summoned and doesn't develop further."] },
  form: { term: 'Forms', section: '7.1', names: ['forms', 'form'], quotes: [
    "Three forms per series, two Levels each: young (the series' first two Levels), grown (the next two) and elder (the last two). The Prime can fall in any form."] },
  cost: { term: 'Cost', section: '7', names: ['cost'], quotes: [
    "Cost: ceil(Level / 2) Energy. Level 1–2 costs 1, 3–4 costs 2, 5–6 costs 3, 7–8 costs 4. Legendary cards cost 5 and are Level 8 from the start. Campaign Creatures are at their Campaign's Level (8.4) and arrive free."] },
  prime: { term: 'Prime', section: '7.1', names: ['Prime', 'Rising', 'Waning'], quotes: [
    'Prime: each Character and Monster series names one Prime Level. A card is Rising below it, Prime at it and Waning above it.',
    'At the Prime Level a card has +1 Attack and +1 Health on top of the curve.',
    'Summoning at Prime gives +1 Renown (section 2), increased by half in the Last Battle like all Renown.'], see: ['curve', 'primeAbility'] },
  curve: { term: 'The stat curve', section: '7.1', names: ['the curve', 'curve'], quotes: [
    "A Rising or Waning card's Attack plus Health is its Level + 2, less 1 per ability. An ability is a keyword or a trigger; Shield and Ward are free, and so is a \"Prime:\" ability.",
    'Swift series lean to Attack, Steady series are even, Slow series lean to Health.'] },
  primeAbility: { term: '"Prime:" abilities', section: '7.1, 12.2', names: ['Prime:'], quotes: [
    'work only if the creature was summoned at its Prime Level. At any other Level the line shows on the card but does nothing, and asks for no target.'] },
  traits: { term: 'Traits', section: '7', names: ['Traits', 'Class', 'Race'], quotes: [
    'Traits: every Character has a Class and a Race. Traits carry no rules of their own until a keyword, trigger or effect refers to them.'] },
  creature: { term: 'Creature', section: '12', names: ['creatures', 'creature', 'Characters', 'Character', 'Monsters', 'Monster'], quotes: [
    '"Creature" in card text means a Character or Monster.', 'Monsters follow every rule in this section exactly as Characters do, for now.'] },
  attack: { term: 'Attack', section: '7, 8.1', names: ['Attack'], quotes: [
    'Attack: the damage it deals.',
    "Trades: the attacker deals its Attack to the target. If the target is Ready, it hits back with its Attack (whether it's Ready is checked when the attack resolves, after any React). Afterwards the attacker is Spent."] },
  health: { term: 'Health', section: '7, 8.1', names: ['Health'], quotes: [
    'Health: the damage it can take.', 'Defeat: a card at 0 Health is defeated and goes to the Released Pile.'] },
  speed: { term: 'Speed', section: '7', names: ['Speed', 'Slow', 'Steady', 'Swift'], quotes: [
    'Speed: Slow, Steady or Swift.', 'A Ready card is one of the fastest Active cards on both sides: the highest Speed among all Active cards. Only Ready cards can attack.'] },
  attackKind: { term: 'Attack kind', section: '7', names: ['Martial', 'Arcane'], quotes: ['Attack kind: Martial or Arcane.'], see: ['shield', 'ward'] },
  shield: { term: 'Shield', section: '8.1', names: ['Shield'], quotes: [
    "A Shield card protects its side's other cards in the same Location (the Wilds count as one Location) from Martial attacks: a Martial attack on a protected card must target the Shield instead.",
    "A guard also protects its Warlord, but only against attackers of the matching kind standing in the guard's own Location.", 'Action cards ignore guards.'] },
  ward: { term: 'Ward', section: '8.1', names: ['Ward'], quotes: [
    "A Shield card protects its side's other cards in the same Location (the Wilds count as one Location) from Martial attacks: a Martial attack on a protected card must target the Shield instead.",
    'A Ward does the same against Arcane attacks.',
    "A guard also protects its Warlord, but only against attackers of the matching kind standing in the guard's own Location.", 'Action cards ignore guards.'] },
  summon: { term: 'Summon', section: '7', names: ['Summoning', 'Summon', 'summoned'], quotes: [
    'Summoning (an action): pay the cost and place it in an empty space on your side (a Legendary takes 3: section 7.2). It arrives Spent. Summoned at its Prime Level, it gives its player +1 Renown (7.1).'] },
  active: { term: 'Active', section: '7', names: ['Active'], quotes: ['Active cards can act this Round.'] },
  ready: { term: 'Ready', section: '7', names: ['Ready'], quotes: ['A Ready card is one of the fastest Active cards on both sides: the highest Speed among all Active cards. Only Ready cards can attack.'] },
  spent: { term: 'Spent', section: '7', names: ['Spent'], quotes: ["A Spent card can't attack or hit back until the next Dawn."] },
  defeat: { term: 'Defeat', section: '8.1', names: ['defeated', 'Defeat'], quotes: [
    'Defeat: a card at 0 Health is defeated and goes to the Released Pile. Its opponent gains 2 Renown and 1 Gold, whatever caused the defeat. If your own effect defeats your own card, nobody is paid.'] },
  retain: { term: 'Retain', section: '8', names: ['Retained', 'Retain'], quotes: [
    "Retain: pay 1 Energy to keep one card in hand through Dusk. Each Retained card means one fewer card drawn at the next Dawn (never below 0), unless it's Patient (12.1).",
    'Any card type can be Retained.'] },
  modes: { term: 'Action modes', section: '8.2', names: ['modes', 'mode'], quotes: ['Each Action card has up to three modes, each with its own cost and effect.'], see: ['react', 'adapt', 'strat'] },
  adapt: { term: 'Adapt', section: '8.2', names: ['Adapt'], quotes: ['Adapt: played on your turn as your action. It resolves at once.'] },
  strat: { term: 'Strat', section: '8.2', names: ['Strat'], quotes: [
    'Strat: played face-down on your turn as your action, paid and targeted then.', 'The opponent sees only that a Strat is sealed, and its target.',
    'It resolves at the start of your next turn, or at Dusk (before dominance) if the Battle Phase ends first.',
    'It fizzles if its target is gone, even if another card now stands in that space. The cost stays paid.'] },
  react: { term: 'React', section: '8.2', names: ['React'], quotes: [
    'React: played outside your turn, in a React window.', 'You React with one card or let it happen.', 'At most one React per action.'] },
  untilDusk: { term: 'Until Dusk', section: '8.2', names: ['until Dusk'], quotes: ['"Until Dusk" effects end at that Round\'s Dusk.'] },
  event: { term: 'Event', section: '8.3', names: ['Event'], quotes: ["Playing an Event costs no Energy. There's no limit per Round."], see: ['release', 'favour'] },
  release: { term: 'Release', section: '8.3', names: ['Release'], quotes: ['Release N: choose exactly N other cards from your hand and put them in the Released Pile. Then the Event resolves and is Released too.'] },
  favour: { term: 'Favour', section: '8.3', names: ['Favour'], quotes: ["Favour: if any Released card meets the Event's Favour condition, you get the stronger effect and +3 Renown."] },
  campaign: { term: 'Campaign', section: '8.4', names: ['Campaign'], quotes: [
    "Campaign cards are shuffled into the deck. Each one's Quest is tracked from the start of the match, whether the card has been drawn or not."], see: ['order', 'quest'] },
  order: { term: 'Campaign Order', section: '8.4', names: ['Campaign Order', 'Order'], quotes: [
    "A drawn Campaign card can only be played as its Campaign Order: an action with its own Energy cost. The Order resolves at once and can't be Reacted to. The card is then discarded and keeps cycling through the deck. Playing it doesn't affect the Quest."] },
  quest: { term: 'Quest', section: '8.4', names: ['Quest'], quotes: [
    "Each one's Quest is tracked from the start of the match, whether the card has been drawn or not.",
    'Quests the engine can count: defeats, Locations dominated (each Location at a Dusk is 1; the Last Battle is 1), damage to the enemy Warlord, and Items bought from the Market.',
    'The Quest stays ticked and makes no further progress.'] },
  campaignCreature: { term: 'Campaign Creature', section: '8.4', names: ['Campaign Creature'], quotes: [
    'Its Campaign Creature arrives Spent, in the empty space its player chooses. It takes one space. If there\'s no empty space, it waits, and the choice is offered as soon as a space frees up (at the Round step where waiting creatures arrive).',
    'A defeated Campaign Creature goes to the Released Pile.', 'Legendary cards and Campaign Creatures are always Prime.'] },
  legendary: { term: 'Legendary', section: '4, 7, 7.2', names: ['Legendary'], quotes: [
    'A Legendary card: at most 1 copy (any number of different Legendaries).', 'Legendary cards cost 5 and are Level 8 from the start.',
    'Summoning: a Legendary needs 3 adjacent empty spaces on its owner\'s side, in lanes with no Location (for example the Wilds 1–3). Its player chooses where. It takes all 3 spaces. If no such place exists, it can\'t be summoned.',
    'it has no countdown: it\'s removed as soon as its Legendary is defeated or leaves play, and those lanes become the Wilds again;',
    'its passive is always negative, and it applies to every creature there except the Legendary;'], see: ['location'] },
  location: { term: 'Location', section: '9', names: ['Locations', 'Location'], quotes: [
    'Placing one is an action that costs no Energy. It covers the lane you choose and the lanes to its right (2, 3 or 4 lanes, set per card) on both sides.',
    'Duration: a Location stays for a set number of Rounds, counting down at Dusk after scoring.',
    'Passive: each Location has one rule that applies to both players\' cards in it, immediately and while they stay. Losing a Health bonus never defeats a card: at least 1 Health is left.'], see: ['dominance'] },
  dominance: { term: 'Dominance', section: '9', names: ['dominance', 'Dominate', 'dominated', 'dominates', 'DOMINATES', 'DOMINATE'], quotes: [
    'Dominance: at Dusk, for each Location, the player with more total Might there gains Renown by the Location\'s width. Ties and empty Locations give nothing. The Wilds are never scored.'], see: ['might'] },
  might: { term: 'Might', section: '9', names: ['Might'], quotes: [
    'Might: a creature\'s Might is its current Attack plus its current Health. Damage, buffs, Prime, Items and Location passives all count, because Might uses current stats.'], see: ['dominance'] },
  gold: { term: 'Gold', section: '10', names: ['Gold'], quotes: ['Gold: +1 at each Dawn, +1 for each enemy card defeated.'] },
  item: { term: 'Item', section: '10', names: ['Items', 'Item'], quotes: [
    'Buying an Item is an action. Buy one Item from your hand or the Market, then use it now (with its target) or store it in your Bag (6 spaces). A stored Item can be used from your next turn.'], see: ['held', 'consumed'] },
  held: { term: 'Held Items', section: '10', names: ['Held'], quotes: ['Held Items: one per card. Lost when that card is defeated.'] },
  consumed: { term: 'Consumed Items', section: '10', names: ['Consumed'], quotes: ['Consumed Items: resolve, then leave play.'] },
  bag: { term: 'Bag', section: '10', names: ['Bag'], quotes: ['store it in your Bag (6 spaces). A stored Item can be used from your next turn.'] },
  market: { term: 'The Market', section: '10', names: ['Market'], quotes: [
    'The Market: one shared pool, starting with one copy of each Item that appears in either deck, and one Item on sale, always shown with its Stock'], see: ['stock'] },
  stock: { term: 'Stock', section: '10', names: ['Stock'], quotes: [
    'Stock is the number of turns it stays on sale: $1 → 8, $2 → 6, $3 → 4, $4 → 3.', 'Each turn taken by either player in the Battle Phase uses 1 Stock.'] },
  lastBattle: { term: 'The Last Battle', section: '11', names: ['Last Battle'], quotes: [
    'Trigger: at Dawn of Round 10, or at the first Dawn where either player has 70 or more Renown, whichever comes first.',
    'Passive: all Renown earned is increased by half, rounded up.'] },
  ambush: { term: 'Ambush', section: '12.1', names: ['Ambush'], quotes: ['It arrives Active rather than Spent.'] },
  armour: { term: 'Armour X', section: '12.1', names: ['Armour'], quotes: ['Each time it would take damage from any source, it takes X less (minimum 0). Armour from different sources adds up.'] },
  riposte: { term: 'Riposte X', section: '12.1', names: ['Riposte'], quotes: ["After an attack on it resolves, if it's still on the battlefield, it deals X damage to the attacker. This works even while it's Spent, and it's separate from hitting back."] },
  patient: { term: 'Patient', section: '12.1', names: ['Patient'], quotes: ["Retaining this card doesn't reduce your next draw."] },
  onSummon: { term: 'On Summon', section: '12.2', names: ['On Summon'], quotes: [
    "resolves just after the creature is placed. If it needs a chosen target, the target is chosen as part of the Summon action. If there's no legal target, the creature still arrives and the effect does nothing."] },
  onDefeat: { term: 'On Defeat', section: '12.2', names: ['On Defeat'], quotes: [
    'resolves just after the creature goes to the Released Pile. "The enemy across from it" means the enemy in the lane it stood in.'] },
  onRetain: { term: 'On Retain', section: '12.2', names: ['On Retain'], quotes: ['resolves when you Retain the card.'] },
  // Stage N (New Cards Batch 1).
  venom: { term: 'Venom', section: '12.1', names: ['Venom'], quotes: ['After this creature deals damage to a creature, that creature becomes Spent.'], see: ['spent'] },
  undying: { term: 'Undying', section: '12.1', names: ['Undying'], quotes: ["The first time it would be defeated, it's left at 1 Health instead. Once per creature."] },
  soaring: { term: 'Soaring', section: '12.1', names: ['Soaring'], quotes: ["Shields can't guard against its attacks. Wards still can, if it's Arcane."], see: ['shield', 'ward'] },
  tinker: { term: 'Tinker', section: '12.1', names: ['Tinker', 'Tinkers'], quotes: ['Whenever you buy an Item from the Market, this gets +1/+1 for good.'], see: ['item'] },
  chill: { term: 'Chill', section: '12.1', names: ['Chill'], quotes: ['A creature that damages this one becomes Spent.'], see: ['spent'] },
  frenzy: { term: 'Frenzy', section: '12.1', names: ['Frenzy'], quotes: ['While damaged, it has +2 Attack.'] },
  rally: { term: 'Rally (group)', section: '12.2', names: ['Rally'], quotes: ['resolves when another creature of that group is summoned on your side.'], see: ['affiliation'] },
  onAttack: { term: 'On Attack', section: '12.2', names: ['On Attack'], quotes: ['resolves when the creature attacks, after the target is chosen and before damage.'] },
  onDawn: { term: 'On Dawn', section: '12.2', names: ['On Dawn'], quotes: ['resolves at each Dawn while the creature is on the battlefield, at the Dawn healing step.'], see: ['dawn'] },
  onDusk: { term: 'On Dusk', section: '12.2', names: ['On Dusk'], quotes: ['resolves at each Dusk while the creature is on the battlefield, before dominance is scored.'], see: ['dusk'] },
  chooseOne: { term: 'Choose one', section: '12.2', names: ['choose one', 'Choose both'], quotes: [
    'Choose one (approved by Elliott, 23 November 2026): an On Summon with modes. The player picks the mode as part of the Summon action.',
    '"Prime: Choose both." At Prime, a choose-one card does every mode.'] },
  sameMoment: { term: 'Triggers at the same moment', section: '12.3', names: ['at the same moment'], quotes: [
    "they resolve in a fixed order: the player with initiative first, then the other player; each player's in lane order, left to right."] },
  affiliation: { term: 'Affiliations', section: '7', names: ['affiliations', 'affiliation', 'home group'], quotes: [
    "Affiliations (New Cards Batch 1, approved by Elliott, 23 November 2026): a card's ancestry (its Race), class, Monster kind and home group.",
    'A card that names a group ("Rally (Fighter)", "your other Orcs", a Favour) means a creature with that affiliation.'] },
  campaignLength: { term: 'Campaign length', section: '8.4', names: ['Side-Quest', 'mid-length'], quotes: [
    "Its Campaign Creature's Level follows its length: Level 4 for a Side-Quest, Level 6 for a mid-length Campaign, Level 8 for a long one. Campaign Creatures always arrive at their Prime."], see: ['campaignCreature'] },
  returnToHand: { term: 'Return to hand', section: '12', names: ["owner's hand"], quotes: [
    "Return to hand: the card goes back to its owner's hand at this Round's Level; damage and anything it gained are lost; its Held Item goes to the Market's pool."] },
  gainEnergy: { term: 'Gain Energy this Round', section: '13 (reading 10)', names: ['Energy this Round'], quotes: ['"Gain N Energy this Round" adds Base Energy, which is lost at the end of the Round.'] },
});

// Terms the Codex would link but the rulebook gives no settled rule to quote (listed in the stage G report).
export const UNWRITTEN = Object.freeze([
  'Damage (as a word on its own: the rulebook uses it but never defines it apart from Attack and Health)',
  'Heal (used on cards; the rulebook has no rule for it beyond the effects list)',
  'Kind (a Monster\'s Kind: only in the open questions, not a settled rule)',
]);

// Every name that links to an entry, longest first (so "Campaign Creature" wins over "Legendary").
export const TERM_NAMES = Object.freeze(Object.entries(GLOSSARY)
  .flatMap(([key, e]) => e.names.map((name) => ({ name, key })))
  .sort((a, b) => b.name.length - a.name.length));

// The rulebook text a glossary quote is checked against: bold, italics and code marks taken off, spaces made single.
export const plainRulebook = (md) => md.replace(/\*\*/g, '').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2').replace(/`/g, '').replace(/\s+/g, ' ');

// The search: glossary entries whose term or names match, then rulebook sections (split at their headings).
export function rulebookSections(md) {
  const out = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^(#{2,3}) (.+)$/);
    if (h) { cur = { id: `sec-${out.length}`, title: h[2].trim(), depth: h[1].length, body: [] }; out.push(cur); continue; }
    if (cur) cur.body.push(line);
  }
  return out.map((x) => ({ ...x, body: x.body.join('\n').trim() }));
}
export function searchRules(query, sections = []) {
  const q = query.trim().toLowerCase();
  if (!q) return { terms: [], sections: [] };
  const terms = Object.entries(GLOSSARY)
    .filter(([, e]) => e.term.toLowerCase().includes(q) || e.names.some((n) => n.toLowerCase().includes(q)) || e.quotes.some((x) => x.toLowerCase().includes(q)))
    .map(([key, e]) => ({ key, term: e.term, exact: e.term.toLowerCase().startsWith(q) || e.names.some((n) => n.toLowerCase().startsWith(q)) }))
    .sort((a, b) => Number(b.exact) - Number(a.exact));
  const secs = sections.filter((x) => x.title.toLowerCase().includes(q) || plainRulebook(x.body).toLowerCase().includes(q))
    .map((x) => ({ id: x.id, title: x.title, inTitle: x.title.toLowerCase().includes(q) }))
    .sort((a, b) => Number(b.inTitle) - Number(a.inTitle));
  return { terms, sections: secs };
}
