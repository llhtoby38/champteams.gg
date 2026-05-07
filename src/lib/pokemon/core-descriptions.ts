/**
 * Data-driven meta core description generator.
 *
 * Given a core (2-3 Pokemon ids) and their `default_sets` rows, produce a
 * human-readable synergy narrative. Philosophy: less info is better than
 * wrong info — we only emit a sentence when the interaction is provable
 * from moves/abilities, and we try to name every Pokemon in the core at
 * least once (including "untagged" carries).
 */

export interface CoreSet {
  id: string;
  name: string;
  ability: string;
  moves: string[];
}

const SETUP_MOVES: Record<string, string> = {
  'Calm Mind': 'Calm Mind',
  'Nasty Plot': 'Nasty Plot',
  'Dragon Dance': 'Dragon Dance',
  'Swords Dance': 'Swords Dance',
  'Bulk Up': 'Bulk Up',
  'Shell Smash': 'Shell Smash',
  'Quiver Dance': 'Quiver Dance',
  'Tail Glow': 'Tail Glow',
  'Iron Defense': 'Iron Defense',
  'Belly Drum': 'Belly Drum',
};

const PHYS_SETUP = new Set(['Dragon Dance', 'Swords Dance', 'Bulk Up', 'Belly Drum']);
const SPEC_SETUP = new Set(['Calm Mind', 'Nasty Plot', 'Tail Glow', 'Quiver Dance']);

const NOTABLE_ATTACKS: Record<string, { type: string; category: 'physical' | 'special' }> = {
  'Moonblast': { type: 'Fairy', category: 'special' },
  'Mystical Fire': { type: 'Fire', category: 'special' },
  'Psyshock': { type: 'Psychic', category: 'special' },
  'Shadow Ball': { type: 'Ghost', category: 'special' },
  'Dazzling Gleam': { type: 'Fairy', category: 'special' },
  'Close Combat': { type: 'Fighting', category: 'physical' },
  'Dire Claw': { type: 'Poison', category: 'physical' },
  'Kowtow Cleave': { type: 'Dark', category: 'physical' },
  'Sucker Punch': { type: 'Dark', category: 'physical' },
  'Iron Head': { type: 'Steel', category: 'physical' },
  'Outrage': { type: 'Dragon', category: 'physical' },
  'Earthquake': { type: 'Ground', category: 'physical' },
  'Last Respects': { type: 'Ghost', category: 'physical' },
  'Wave Crash': { type: 'Water', category: 'physical' },
  'Electro Shot': { type: 'Electric', category: 'special' },
  'Heat Wave': { type: 'Fire', category: 'special' },
  'Hurricane': { type: 'Flying', category: 'special' },
  'Hydro Pump': { type: 'Water', category: 'special' },
  'Thunder': { type: 'Electric', category: 'special' },
  'Draco Meteor': { type: 'Dragon', category: 'special' },
  'Fire Blast': { type: 'Fire', category: 'special' },
  'Solar Beam': { type: 'Grass', category: 'special' },
};

function firstNotableAttack(moves: string[]): string | null {
  for (const m of moves) if (NOTABLE_ATTACKS[m]) return m;
  return null;
}

function hasAny(arr: string[], targets: Set<string>): boolean {
  return arr.some(m => targets.has(m));
}

function findSetupMove(moves: string[]): string | null {
  for (const m of moves) if (SETUP_MOVES[m]) return m;
  return null;
}

/**
 * Build a list of specific, high-confidence synergy sentences. The order
 * matters: earlier patterns (weather-speed-boost, setup narratives) win over
 * later generic ones because they tell a more complete story.
 */
function synergySentences(sets: CoreSet[]): { mentioned: Set<string>; sentences: string[] } {
  const mentioned = new Set<string>();
  const sentences: string[] = [];
  const mark = (...ids: string[]) => ids.forEach(id => mentioned.add(id));

  const findByAbility = (a: string) => sets.find(s => s.ability === a);
  const findByMove = (m: string) => sets.find(s => s.moves.includes(m));
  const findWith = (pred: (s: CoreSet) => boolean) => sets.find(pred);

  // ── Rain package ─────────────────────────────────────────────────────────
  const drizzle = findByAbility('Drizzle');
  if (drizzle) {
    const swiftSwim = findWith(s => s.ability === 'Swift Swim' && s.id !== drizzle.id);
    const electroShot = findWith(s => s.moves.includes('Electro Shot') && s.id !== drizzle.id);
    const waveCrash = findWith(s => s.moves.includes('Wave Crash') && s.id !== drizzle.id);
    const hydroPump = findWith(s => s.moves.includes('Hydro Pump') && s.id !== drizzle.id);
    const thunder = findWith(s => s.moves.includes('Thunder') && s.id !== drizzle.id && s.id !== electroShot?.id);

    if (swiftSwim && electroShot && swiftSwim.id !== electroShot.id) {
      sentences.push(`${drizzle.name}'s Drizzle sets Rain — ${swiftSwim.name}'s Swift Swim doubles its Speed, while ${electroShot.name} fires Electro Shot instantly (no charge turn) for a boosted Electric hit.`);
      mark(drizzle.id, swiftSwim.id, electroShot.id);
    } else if (swiftSwim) {
      const payoff = waveCrash && waveCrash.id === swiftSwim.id ? ' and lets it slam Wave Crash at full power' : hydroPump && hydroPump.id === swiftSwim.id ? ' for rain-boosted Hydro Pump' : '';
      sentences.push(`${drizzle.name}'s Drizzle doubles ${swiftSwim.name}'s Speed through Swift Swim${payoff}.`);
      mark(drizzle.id, swiftSwim.id);
    } else if (electroShot) {
      sentences.push(`${drizzle.name}'s Rain lets ${electroShot.name} fire Electro Shot without a charge turn for a boosted +1 Sp. Atk Electric hit.`);
      mark(drizzle.id, electroShot.id);
    } else if (thunder) {
      sentences.push(`${drizzle.name}'s Rain gives ${thunder.name} a 100% accurate Thunder.`);
      mark(drizzle.id, thunder.id);
    } else {
      sentences.push(`${drizzle.name}'s Drizzle sets Rain, boosting Water moves 50% and enabling rain-dependent abilities.`);
      mark(drizzle.id);
    }
  }

  // ── Sun package ──────────────────────────────────────────────────────────
  const drought = findByAbility('Drought');
  if (drought) {
    const chlorophyll = findWith(s => s.ability === 'Chlorophyll' && s.id !== drought.id);
    const solarPower = findWith(s => s.ability === 'Solar Power' && s.id !== drought.id);
    const solarBeam = findWith(s => s.moves.includes('Solar Beam') && s.id !== drought.id);
    const hasSolarBeam = solarBeam?.moves.includes('Solar Beam');

    if (chlorophyll && solarBeam && chlorophyll.id === solarBeam.id) {
      sentences.push(`${drought.name}'s Drought doubles ${chlorophyll.name}'s Speed via Chlorophyll and removes Solar Beam's charge turn.`);
      mark(drought.id, chlorophyll.id);
    } else if (chlorophyll) {
      sentences.push(`${drought.name}'s Sun doubles ${chlorophyll.name}'s Speed via Chlorophyll.`);
      mark(drought.id, chlorophyll.id);
    } else if (solarPower) {
      sentences.push(`${drought.name}'s Sun powers up ${solarPower.name}'s Solar Power for +50% Sp. Atk.`);
      mark(drought.id, solarPower.id);
    } else if (hasSolarBeam && solarBeam) {
      sentences.push(`${drought.name}'s Sun lets ${solarBeam.name} fire Solar Beam without a charge turn.`);
      mark(drought.id, solarBeam.id);
    } else {
      sentences.push(`${drought.name}'s Drought sets Sun, boosting Fire moves 50%.`);
      mark(drought.id);
    }
  }

  // ── Sand package ─────────────────────────────────────────────────────────
  const sand = findByAbility('Sand Stream');
  if (sand) {
    const sandRush = findWith(s => s.ability === 'Sand Rush' && s.id !== sand.id);
    if (sandRush) {
      sentences.push(`${sand.name}'s Sandstorm doubles ${sandRush.name}'s Speed via Sand Rush.`);
      mark(sand.id, sandRush.id);
    } else {
      sentences.push(`${sand.name}'s Sand Stream chips non-Rock/Ground/Steel foes and enables sand-based synergies.`);
      mark(sand.id);
    }
  }

  // ── Snow / Aurora Veil ────────────────────────────────────────────────────
  const snow = findByAbility('Snow Warning');
  if (snow) {
    const veil = findWith(s => s.moves.includes('Aurora Veil'));
    if (veil) {
      sentences.push(`${snow.name}'s Snow enables ${veil.name}'s Aurora Veil for dual-screen protection.`);
      mark(snow.id, veil.id);
    } else {
      sentences.push(`${snow.name}'s Snow boosts Ice-type defenses and powers Slush Rush allies.`);
      mark(snow.id);
    }
  }

  // ── Tailwind + setup sweeper narrative ────────────────────────────────────
  const tailwinder = findByMove('Tailwind');
  if (tailwinder) {
    const setupSweeper = findWith(s => s.id !== tailwinder.id && findSetupMove(s.moves) !== null);
    if (setupSweeper) {
      const setup = findSetupMove(setupSweeper.moves)!;
      sentences.push(`${tailwinder.name} sets Tailwind so ${setupSweeper.name} can set up ${setup} under speed control and sweep.`);
      mark(tailwinder.id, setupSweeper.id);
    } else {
      const fastAttacker = findWith(s => s.id !== tailwinder.id && firstNotableAttack(s.moves) !== null);
      if (fastAttacker) {
        sentences.push(`${tailwinder.name} provides Tailwind so ${fastAttacker.name} can outspeed and threaten with ${firstNotableAttack(fastAttacker.moves)}.`);
        mark(tailwinder.id, fastAttacker.id);
      } else {
        sentences.push(`${tailwinder.name} provides Tailwind for team-wide speed control.`);
        mark(tailwinder.id);
      }
    }
  }

  // ── Trick Room + slow heavy hitter ───────────────────────────────────────
  const trSetter = findByMove('Trick Room');
  if (trSetter) {
    const slowHitter = findWith(s => s.id !== trSetter.id && firstNotableAttack(s.moves) !== null);
    if (slowHitter) {
      sentences.push(`${trSetter.name} sets Trick Room so slow attackers like ${slowHitter.name} outspeed the field and hit with ${firstNotableAttack(slowHitter.moves)}.`);
      mark(trSetter.id, slowHitter.id);
    } else {
      sentences.push(`${trSetter.name} sets Trick Room, reversing turn order for slow hitters.`);
      mark(trSetter.id);
    }
  }

  // ── Redirection protects a setup partner ─────────────────────────────────
  const redirector = findWith(s => s.moves.includes('Follow Me') || s.moves.includes('Rage Powder'));
  if (redirector && !mentioned.has(redirector.id)) {
    const setupSweeper = findWith(s => s.id !== redirector.id && findSetupMove(s.moves) !== null);
    const move = redirector.moves.includes('Follow Me') ? 'Follow Me' : 'Rage Powder';
    if (setupSweeper && !mentioned.has(setupSweeper.id)) {
      const setup = findSetupMove(setupSweeper.moves)!;
      sentences.push(`${redirector.name} redirects attacks with ${move}, buying ${setupSweeper.name} a free turn to ${setup}.`);
      mark(redirector.id, setupSweeper.id);
    } else {
      sentences.push(`${redirector.name} uses ${move} to redirect attacks away from partners.`);
      mark(redirector.id);
    }
  }

  // ── Perish Trap (Shadow Tag + Perish Song) ───────────────────────────────
  const shadowTag = findByAbility('Shadow Tag');
  const perish = findByMove('Perish Song');
  if (shadowTag && perish) {
    if (shadowTag.id === perish.id) {
      sentences.push(`${shadowTag.name} traps opponents with Shadow Tag and forces KOs via Perish Song.`);
      mark(shadowTag.id);
    } else {
      sentences.push(`${shadowTag.name}'s Shadow Tag prevents escape while ${perish.name}'s Perish Song forces 3-turn KOs.`);
      mark(shadowTag.id, perish.id);
    }
  }

  // ── Levitate + Earthquake ────────────────────────────────────────────────
  const levitate = findByAbility('Levitate');
  const eq = findByMove('Earthquake');
  if (levitate && eq && levitate.id !== eq.id) {
    sentences.push(`${levitate.name}'s Levitate absorbs ${eq.name}'s Earthquake, enabling free spread damage.`);
    mark(levitate.id, eq.id);
  }

  // ── Fake Out + setup partner ─────────────────────────────────────────────
  const fakeOut = findByMove('Fake Out');
  if (fakeOut && !mentioned.has(fakeOut.id)) {
    const setupSweeper = findWith(s => s.id !== fakeOut.id && findSetupMove(s.moves) !== null && !mentioned.has(s.id));
    if (setupSweeper) {
      const setup = findSetupMove(setupSweeper.moves)!;
      sentences.push(`${fakeOut.name}'s Fake Out flinches a threat so ${setupSweeper.name} can ${setup} the turn they come in.`);
      mark(fakeOut.id, setupSweeper.id);
    }
  }

  // ── Intimidate + Defiant ─────────────────────────────────────────────────
  const defiant = findByAbility('Defiant');
  const intimidate = findByAbility('Intimidate');
  if (defiant && intimidate && defiant.id !== intimidate.id) {
    sentences.push(`${intimidate.name}'s Intimidate softens physical threats while ${defiant.name}'s Defiant punishes opposing Intimidate with +2 Attack.`);
    mark(intimidate.id, defiant.id);
  } else if (intimidate && !mentioned.has(intimidate.id)) {
    sentences.push(`${intimidate.name}'s Intimidate drops opposing Attack on switch-in.`);
    mark(intimidate.id);
  }

  // ── Flash Fire + allied Fire move ────────────────────────────────────────
  const flashFire = findByAbility('Flash Fire');
  if (flashFire) {
    const fireAlly = findWith(s => s.id !== flashFire.id && s.moves.some(m => ['Flamethrower', 'Fire Blast', 'Heat Wave', 'Eruption', 'Lava Plume', 'Sacred Fire'].includes(m)));
    if (fireAlly) {
      sentences.push(`${flashFire.name}'s Flash Fire absorbs ${fireAlly.name}'s spread Fire moves for a 1.5× boost.`);
      mark(flashFire.id, fireAlly.id);
    }
  }

  return { mentioned, sentences };
}

/**
 * Describe any Pokemon not already mentioned by a synergy sentence. Uses a
 * conservative role template — we only emit if we can name something
 * concrete (a setup move, a notable attack, a strong ability).
 */
function describeRemaining(sets: CoreSet[], mentioned: Set<string>): string[] {
  const out: string[] = [];
  for (const s of sets) {
    if (mentioned.has(s.id)) continue;

    const setup = findSetupMove(s.moves);
    const notable = firstNotableAttack(s.moves);

    if (setup && notable) {
      out.push(`${s.name} sets up ${setup} and sweeps with ${notable}.`);
    } else if (setup) {
      out.push(`${s.name} boosts with ${setup} before attacking.`);
    } else if (notable) {
      const category = NOTABLE_ATTACKS[notable].category;
      out.push(`${s.name} pressures with ${category === 'physical' ? 'physical' : 'special'} ${notable}.`);
    } else if (s.moves.includes('Protect')) {
      // Nothing distinctive — skip rather than guess.
    }
    // If we can't say anything confident, stay silent (user rule: less > wrong).
  }
  return out;
}

export function generateCoreDescription(sets: CoreSet[]): string {
  if (sets.length < 2) return '';
  const { mentioned, sentences } = synergySentences(sets);
  const remaining = describeRemaining(sets, mentioned);
  return [...sentences, ...remaining].join(' ').trim();
}

const ABILITY_TAGS: Record<string, string> = {
  'Drizzle': 'rain',
  'Swift Swim': 'rain',
  'Drought': 'sun',
  'Chlorophyll': 'sun',
  'Solar Power': 'sun',
  'Sand Stream': 'sand',
  'Sand Rush': 'sand',
  'Snow Warning': 'snow',
  'Slush Rush': 'snow',
  'Intimidate': 'intimidate',
  'Defiant': 'defiant',
  'Competitive': 'defiant',
  'Electric Surge': 'terrain',
  'Psychic Surge': 'terrain',
  'Grassy Surge': 'terrain',
  'Misty Surge': 'terrain',
};

const MOVE_TAGS: Record<string, string> = {
  'Fake Out': 'fake-out',
  'Tailwind': 'tailwind',
  'Trick Room': 'trick-room',
  'Follow Me': 'redirection',
  'Rage Powder': 'redirection',
  'Reflect': 'screens',
  'Light Screen': 'screens',
  'Aurora Veil': 'screens',
};

/**
 * Derive filterable tag ids from a core's default sets + pokemon ids.
 *
 * The pipeline's stored `tags` column is sparse (missing common archetypes
 * like `defiant` on Kingambit or `mega` on any Mega form). This function
 * re-derives tags from abilities/moves/ids so filters match what the UI
 * claims they should. We return ids only — labels/colors are attached in
 * the UI via `TEAM_TAGS`.
 */
export function deriveCoreTags(sets: CoreSet[]): string[] {
  const tags = new Set<string>();
  for (const s of sets) {
    const aTag = ABILITY_TAGS[s.ability];
    if (aTag) tags.add(aTag);
    for (const m of s.moves) {
      const mTag = MOVE_TAGS[m];
      if (mTag) tags.add(mTag);
    }
    if (/mega/i.test(s.id) || /-Mega/.test(s.name)) tags.add('mega');
  }
  return Array.from(tags);
}
