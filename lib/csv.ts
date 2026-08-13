import { UNITS } from "./roster";
import { DISCIPLINES, type Discipline, type Shift, type Staff } from "./types";

/*
 * Schedule CSV import.
 *
 * Written to be forgiving about headers and time formats, because the file
 * comes out of whatever the scheduling office already uses. Anything it can't
 * read is reported per row rather than dropped silently — a schedule that
 * imports 90% of its shifts without saying so is worse than one that fails.
 */

/**
 * `error` means the row was dropped; `warning` means it was imported with an
 * adjustment. Keeping them apart matters — telling someone a row was skipped
 * when it actually landed sends them looking for a gap that isn't there.
 */
export type CsvIssue = {
  row: number;
  message: string;
  kind: "error" | "warning";
};

export type CsvParseResult = {
  shifts: Shift[];
  staff: Staff[];
  issues: CsvIssue[];
  /** Header names that were recognised, for the confirmation summary. */
  columns: Record<string, string>;
};

/** Minimal RFC4180 splitter — handles quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function normaliseHeader(value: string) {
  return value.toLowerCase().replace(/[\s_.-]+/g, "");
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "employeename", "staffname", "fullname", "employee"],
  employeeNumber: [
    "employeenumber",
    "employeeno",
    "employeeid",
    "empno",
    "empid",
    "badge",
    "id",
  ],
  discipline: ["discipline", "specialty", "speciality", "role", "profession", "dept"],
  date: ["date", "shiftdate", "day", "workdate"],
  hours: ["shifthours", "hours", "shift", "shifttime", "time", "schedule"],
  unit: ["unit", "location", "ward", "department", "floor"],
};

const DISCIPLINE_ALIASES: Record<string, Discipline> = {
  dpt: "DPT",
  pt: "DPT",
  physicaltherapy: "DPT",
  physicaltherapist: "DPT",
  rn: "RN",
  nurse: "RN",
  nursing: "RN",
  registerednurse: "RN",
  ot: "OT",
  occupationaltherapy: "OT",
  occupationaltherapist: "OT",
  slp: "SLP",
  speech: "SLP",
  speechtherapy: "SLP",
  md: "MD",
  do: "MD",
  physician: "MD",
  doctor: "MD",
  rt: "RT",
  respiratory: "RT",
  respiratorytherapy: "RT",
};

function resolveDiscipline(value: string): Discipline | null {
  const key = normaliseHeader(value);
  if (DISCIPLINE_ALIASES[key]) return DISCIPLINE_ALIASES[key];
  const upper = value.trim().toUpperCase();
  return (DISCIPLINES as readonly string[]).includes(upper)
    ? (upper as Discipline)
    : null;
}

/** "7", "7:30", "0730", "7am", "3 PM" -> decimal hours. */
function parseClock(raw: string): number | null {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!value) return null;

  const meridiem = value.endsWith("am") ? "am" : value.endsWith("pm") ? "pm" : null;
  const digits = meridiem ? value.slice(0, -2) : value;

  let hours: number;
  let minutes = 0;

  if (digits.includes(":")) {
    const [h, m] = digits.split(":");
    hours = Number(h);
    minutes = Number(m ?? 0);
  } else if (/^\d{3,4}$/.test(digits)) {
    hours = Number(digits.slice(0, digits.length - 2));
    minutes = Number(digits.slice(-2));
  } else if (/^\d{1,2}$/.test(digits)) {
    hours = Number(digits);
  } else {
    return null;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours < 0 || hours > 24 || minutes < 0 || minutes >= 60) return null;

  return hours + minutes / 60;
}

/** "07:00-15:30", "0700 to 1530", "7am – 3pm" -> [start, end]. */
function parseRange(raw: string): [number, number] | null {
  const parts = raw.split(/\s*(?:-|–|—|to|until)\s*/i).filter(Boolean);
  if (parts.length < 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start === null || end === null) return null;
  return [start, end];
}

/** Accepts yyyy-mm-dd, mm/dd/yyyy, and m/d/yy. */
function parseDateCell(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return formatKey(y, m, d);
  }
  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += 2000;
    return formatKey(year, month, day);
  }
  return null;
}

function formatKey(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function parseScheduleCsv(text: string): CsvParseResult {
  const issues: CsvIssue[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      shifts: [],
      staff: [],
      issues: [{ row: 0, kind: "error", message: "The file is empty." }],
      columns: {},
    };
  }

  const header = splitCsvLine(lines[0]).map(normaliseHeader);
  const columns: Record<string, string> = {};
  const indexOf: Record<string, number> = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = header.findIndex((cell) => aliases.includes(cell));
    if (index >= 0) {
      indexOf[field] = index;
      columns[field] = splitCsvLine(lines[0])[index];
    }
  }

  for (const required of ["name", "discipline", "date", "hours"]) {
    if (indexOf[required] === undefined) {
      issues.push({
        row: 1,
        kind: "error",
        message: `No "${required}" column found. Recognised headings: ${HEADER_ALIASES[required].join(", ")}.`,
      });
    }
  }
  if (issues.length > 0) {
    return { shifts: [], staff: [], issues, columns };
  }

  const shifts: Shift[] = [];
  const staffByNumber = new Map<string, Staff>();
  const perDayCount = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cells = splitCsvLine(lines[i]);
    const cell = (field: string) => cells[indexOf[field]] ?? "";

    const name = cell("name");
    if (!name) {
      issues.push({ row: rowNumber, kind: "error", message: "Missing name." });
      continue;
    }

    const discipline = resolveDiscipline(cell("discipline"));
    if (!discipline) {
      issues.push({
        row: rowNumber,
        kind: "error",
        message: `Unrecognised specialty "${cell("discipline")}". Expected one of ${DISCIPLINES.join(", ")}.`,
      });
      continue;
    }

    const date = parseDateCell(cell("date"));
    if (!date) {
      issues.push({
        row: rowNumber,
        kind: "error",
        message: `Unreadable date "${cell("date")}". Use YYYY-MM-DD or MM/DD/YYYY.`,
      });
      continue;
    }

    const range = parseRange(cell("hours"));
    if (!range) {
      issues.push({
        row: rowNumber,
        kind: "error",
        message: `Unreadable shift hours "${cell("hours")}". Use a range like 07:00-15:30.`,
      });
      continue;
    }

    const [startHour] = range;
    let [, endHour] = range;
    if (endHour <= startHour) {
      // An overnight shift, which this model can't represent yet — clamp to
      // midnight and say so rather than inventing a negative-length shift.
      issues.push({
        row: rowNumber,
        kind: "warning",
        message: `Shift "${cell("hours")}" appears to cross midnight; imported as ending at midnight.`,
      });
      endHour = 24;
    }

    const employeeNumber =
      indexOf.employeeNumber !== undefined && cell("employeeNumber")
        ? cell("employeeNumber")
        : `CSV-${hashCode(name) % 100000}`;

    let person = staffByNumber.get(employeeNumber);
    if (!person) {
      person = {
        id: `csv-${employeeNumber}`,
        name,
        employeeNumber,
        discipline,
        email: `${employeeNumber.toLowerCase()}@stefo.local`,
        colorIndex: hashCode(name),
      };
      staffByNumber.set(employeeNumber, person);
    }

    const index = perDayCount.get(date) ?? 0;
    perDayCount.set(date, index + 1);

    shifts.push({
      id: `${date}#${index}`,
      date,
      startHour,
      endHour,
      discipline,
      unit:
        indexOf.unit !== undefined && cell("unit") ? cell("unit") : UNITS[0],
      staffId: person.id,
    });
  }

  return { shifts, staff: [...staffByNumber.values()], issues, columns };
}
