import type { Discipline, Staff } from "./types";

/**
 * Demo roster. Replaced by the CSV upload on the admin page, and eventually by
 * a Supabase table — nothing here should be treated as real staff data.
 */
export const ROSTER: Staff[] = [
  { id: "s01", name: "Ryan Young", employeeNumber: "E10431", discipline: "DPT", email: "ryoung@usc.edu", colorIndex: 0 },
  { id: "s02", name: "Alicia Moreno", employeeNumber: "E10778", discipline: "DPT", email: "amoreno@usc.edu", colorIndex: 1 },
  { id: "s03", name: "Devon Clarke", employeeNumber: "E10902", discipline: "DPT", email: "dclarke@usc.edu", colorIndex: 2 },
  { id: "s04", name: "Priya Raman", employeeNumber: "E11045", discipline: "OT", email: "praman@usc.edu", colorIndex: 3 },
  { id: "s05", name: "Marcus Webb", employeeNumber: "E11190", discipline: "OT", email: "mwebb@usc.edu", colorIndex: 4 },
  { id: "s06", name: "Hannah Fischer", employeeNumber: "E11233", discipline: "SLP", email: "hfischer@usc.edu", colorIndex: 5 },
  { id: "s07", name: "Grace Okonkwo", employeeNumber: "E11310", discipline: "RN", email: "gokonkwo@usc.edu", colorIndex: 6 },
  { id: "s08", name: "Tomás Ibarra", employeeNumber: "E11402", discipline: "RN", email: "tibarra@usc.edu", colorIndex: 7 },
  { id: "s09", name: "Nadia Haddad", employeeNumber: "E11487", discipline: "RN", email: "nhaddad@usc.edu", colorIndex: 8 },
  { id: "s10", name: "Ellis Brandt", employeeNumber: "E11556", discipline: "RT", email: "ebrandt@usc.edu", colorIndex: 9 },
  { id: "s11", name: "Sofia Lindqvist", employeeNumber: "E11604", discipline: "RT", email: "slindqvist@usc.edu", colorIndex: 1 },
  { id: "s12", name: "Dr. Amara Osei", employeeNumber: "E11688", discipline: "MD", email: "aosei@usc.edu", colorIndex: 3 },
  { id: "s13", name: "Dr. Jonah Reyes", employeeNumber: "E11720", discipline: "MD", email: "jreyes@usc.edu", colorIndex: 5 },
  { id: "s14", name: "Kaito Nakamura", employeeNumber: "E11803", discipline: "DPT", email: "knakamura@usc.edu", colorIndex: 9 },
];

export const UNITS = [
  "Acute Rehab",
  "ICU",
  "Med-Surg",
  "Orthopedics",
  "Emergency",
  "Outpatient",
] as const;

export function staffById(roster: Staff[], id: string | null) {
  if (!id) return null;
  return roster.find((person) => person.id === id) ?? null;
}

export function staffByDiscipline(roster: Staff[], discipline: Discipline) {
  return roster.filter((person) => person.discipline === discipline);
}

/**
 * Maps the signed-in email onto a roster entry. Unknown emails borrow the first
 * DPT identity so a new demo account still has shifts of its own to release —
 * without that, half the interactions would have nothing to act on.
 */
export function resolveCurrentStaff(roster: Staff[], email: string): Staff {
  const match = roster.find(
    (person) => person.email.toLowerCase() === email.toLowerCase(),
  );
  if (match) return match;
  return { ...roster[0], email };
}
