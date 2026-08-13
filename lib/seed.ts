import { ROSTER, UNITS } from "./roster";
import type { Discipline, Shift } from "./types";
import { parseDateKey } from "./calendar";

/*
 * Demo schedule. Generated deterministically from the date string rather than
 * stored, so every server instance and every restart produces the same roster —
 * important while there's no database behind this. Real schedules arrive via
 * the admin CSV upload, which layers on top of these.
 */

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG — same seed, same sequence, on server and client. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Block = { startHour: number; endHour: number };

/** Daytime cover — the only pattern therapy services run. */
const DAY_BLOCKS: Block[] = [
  { startHour: 7, endHour: 15 },
  { startHour: 7, endHour: 15 },
  { startHour: 9, endHour: 17 },
  { startHour: 8, endHour: 12 },
  { startHour: 11, endHour: 19 },
];

/** Nursing, respiratory and physicians additionally cover evenings and nights. */
const ROUND_CLOCK_BLOCKS: Block[] = [
  ...DAY_BLOCKS,
  { startHour: 15, endHour: 23 },
  { startHour: 15, endHour: 23 },
  { startHour: 0, endHour: 8 },
];

const COVERS_NIGHTS: ReadonlySet<Discipline> = new Set<Discipline>([
  "RN",
  "RT",
  "MD",
]);

function blocksFor(discipline: Discipline): Block[] {
  return COVERS_NIGHTS.has(discipline) ? ROUND_CLOCK_BLOCKS : DAY_BLOCKS;
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

/**
 * The demo schedule for one day: every day gets staffed, weekends run lighter,
 * and a slice of each day is left open across a mix of disciplines.
 */
export function seedShiftsForDate(dateKey: string): Shift[] {
  const random = mulberry32(hashString(dateKey));
  const weekday = parseDateKey(dateKey).getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  const shifts: Shift[] = [];
  let index = 0;

  const add = (
    discipline: Discipline,
    block: Block,
    staffId: string | null,
  ) => {
    shifts.push({
      id: `${dateKey}#${index++}`,
      date: dateKey,
      startHour: block.startHour,
      endHour: block.endHour,
      discipline,
      unit: pick(random, UNITS),
      staffId,
    });
  };

  // The signed-in DPT works a realistic full-time pattern — roughly four days
  // in five, plus the occasional weekend. Scheduling them every single day
  // would put their monthly hours somewhere no real clinician goes.
  const worksToday = isWeekend ? random() < 0.18 : random() < 0.72;
  if (worksToday) {
    add("DPT", pick(random, DAY_BLOCKS), "s01");
  }

  const staffedCount = isWeekend ? 3 + Math.floor(random() * 2) : 5 + Math.floor(random() * 3);
  const others = ROSTER.filter((person) => person.id !== "s01");

  const used = new Set<string>();
  for (let i = 0; i < staffedCount; i++) {
    const person = pick(random, others);
    if (used.has(person.id)) continue;
    used.add(person.id);
    add(person.discipline, pick(random, blocksFor(person.discipline)), person.id);
  }

  // Open shifts: a couple a day on weekdays, more at weekends, spread across
  // disciplines so the sidebar filter has something to sort through.
  const openCount = isWeekend ? 3 + Math.floor(random() * 2) : 2 + Math.floor(random() * 2);
  const disciplines: Discipline[] = ["DPT", "RN", "OT", "SLP", "MD", "RT"];
  for (let i = 0; i < openCount; i++) {
    const discipline = pick(random, disciplines);
    add(discipline, pick(random, blocksFor(discipline)), null);
  }

  return shifts.sort(
    (a, b) => a.startHour - b.startHour || a.discipline.localeCompare(b.discipline),
  );
}
