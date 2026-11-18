// Stage A: the new art and the Characters' names (Elliott, 18 November 2026). No rule changes: these check the card
// data the art tools record, the names the card data gives, and where a Location tile is drawn from its scene.
import { test, run, assert } from './helpers.js';
import { existsSync, readFileSync } from 'node:fs';
import { defineCards, cardAtRound, creatureAtLevel, cardDef } from '../src/engine/cards.js';
import { CARDS } from '../src/data/cards.js';
import { ART } from '../src/data/art.js';
import { nameParts, fullArtOf, artOf } from '../src/ui/text.js';
import { tileArt, TILE_H, LANE_W } from '../src/ui/view.js';

defineCards(CARDS);
const json = JSON.parse(readFileSync('docs/cards.json', 'utf8'));
const crops = JSON.parse(readFileSync('assets/cards-v3/crops.json', 'utf8'));
const withArt = CARDS.flatMap((d) => [...(d.forms ?? [d]), ...(d.legendaryCreature ? [d.legendaryCreature] : [])]).filter((x) => x.art);

test('every card has its new art: the card crop, its full scene and its crop centre, recorded from the art', () => {
  assert.equal(withArt.length, 54);
  assert.equal(ART.size, 54);
  for (const x of withArt) {
    const id = x.art.split('/').pop().replace('.jpg', '');
    assert.ok(existsSync(x.art), `${x.art} exists`);
    assert.equal(x.artFull, `assets/cards-v3/${id}.jpg`);
    assert.ok(existsSync(x.artFull), `${x.artFull} exists`);
    assert.equal(x.cardX, crops[id].cardX, `${id}: cardX is the crop centre in crops.json`);
  }
  // (docs/cards.json carries the same, written by tools/buildcards.mjs.)
  const jsonArt = json.cards.flatMap((d) => [...(d.forms ?? [d]), ...(d.legendaryCreature ? [d.legendaryCreature] : [])]).filter((x) => x.art);
  assert.equal(jsonArt.filter((x) => x.artFull && Number.isFinite(x.cardX)).length, 54);
});

test('Location tiles: each has its focus point, and a tile of any width is drawn around it', () => {
  const tiles = JSON.parse(readFileSync('assets/cards-v3/tiles.json', 'utf8'));
  for (const id of ['ironroot-pass', 'emberfall-ruins', 'mistveil-marshes']) {
    const c = cardAtRound(id, 1, 'x');
    assert.deepEqual([c.tileX, c.tileY], [tiles[id].tileX, tiles[id].tileY]);
    for (const lanes of [2, 3, 4]) {
      const w = lanes * LANE_W - 8;
      const html = tileArt(c, w);
      assert.ok(html.includes(c.artFull));
      const [ox, oy] = html.match(/object-position:(-?[\d.]+)px (-?[\d.]+)px/).slice(1).map(Number);
      const k = Math.max(w / 1536, TILE_H / 1024);
      // The image covers the tile, and the focus sits at the tile's centre unless the image's edge stops it.
      assert.ok(ox <= 0.01 && oy <= 0.01 && 1536 * k + ox >= w - 0.5 && 1024 * k + oy >= TILE_H - 0.5);
      const fx = c.tileX * k + ox;
      assert.ok(Math.abs(fx - w / 2) < 0.6 || Math.abs(ox) < 0.01 || Math.abs(1536 * k + ox - w) < 0.6, `${id} at ${lanes} lanes: the focus is centred`);
    }
  }
  assert.deepEqual([cardAtRound('ironroot-pass', 1, 'x').tileX, cardAtRound('ironroot-pass', 1, 'x').tileY], [760, 330]);
});

test('Characters have first names shared by all three forms, and three forms are renamed', () => {
  const FIRST = { 'oathsworn-recruit': 'Garrick', 'hollowfoot-cutpurse': 'Fennick', 'ashen-spire-apprentice': 'Corvin', 'deepforge-acolyte': 'Brenna', 'thornwood-scout': 'Ilyra', 'ironhide-brawler': 'Gorran', 'cinderwick-prodigy': 'Tilda', 'duskmere-oracle': 'Elowen' };
  for (const d of CARDS.filter((x) => x.cardType === 'Character')) {
    assert.equal(d.firstName, FIRST[d.id], d.id);
    for (const f of d.forms) {
      assert.equal(f.firstName, FIRST[d.id]);
      assert.equal(f.name, `${FIRST[d.id]}, ${f.title}`);
      assert.match(f.title, /^the /);
    }
  }
  for (const d of CARDS.filter((x) => x.cardType === 'Monster')) for (const f of d.forms) assert.equal(f.firstName, undefined, `${f.id} keeps its name`);
  const nameOf = (id) => CARDS.flatMap((d) => d.forms ?? []).find((f) => f.id === id).name;
  assert.equal(nameOf('oathsworn-veteran'), 'Garrick, the Oathsworn Lord-Commander');
  assert.equal(nameOf('hollowfoot-fence'), 'Fennick, the Hollowfoot Guildmaster');
  assert.equal(nameOf('cinderwick-hermit'), 'Tilda, the Cinderwick Pyromancer');
  assert.equal(nameOf('archmagus-of-the-ashen-spire'), 'Corvin, the Archmagus of the Ashen Spire');
  assert.equal(cardDef('lady-corwens-commission').legendaryCreature.name, 'Aldric the Unbroken');
});

test('the card face shows the first name (title beneath on a full card); words use the whole name', () => {
  const ilyra = creatureAtLevel(cardDef('thornwood-scout'), 3, 'u');
  assert.equal(ilyra.name, 'Ilyra, the Thornwood Pathfinder');
  assert.deepEqual(nameParts(ilyra), { first: 'Ilyra', title: 'the Thornwood Pathfinder' });
  const wolf = creatureAtLevel(cardDef('gloomfang-wolf'), 3, 'w');
  assert.deepEqual(nameParts(wolf), { first: 'Gloomfang Wolf', title: null });
  assert.deepEqual(nameParts(cardAtRound('firebolt', 1, 'f')), { first: 'Firebolt', title: null });
  assert.equal(fullArtOf(ilyra), 'assets/cards-v3/thornwood-pathfinder.jpg');
  assert.equal(artOf(ilyra), 'assets/cards/thornwood-pathfinder.jpg');
});

run();
