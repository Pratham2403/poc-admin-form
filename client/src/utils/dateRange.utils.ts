export type TimePreset = "today" | "month" | "all";

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

const IST_OFFSET_MINUTES = 5 * 60 + 30;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Convert a UTC ISO string into an IST display string.
 * Format: DD/MM/YYYY HH:mm
 */
export const utcIsoToIstDateTimeDisplay = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = pad2(ist.getUTCMonth() + 1);
  const day = pad2(ist.getUTCDate());
  const hh = pad2(ist.getUTCHours());
  const mm = pad2(ist.getUTCMinutes());
  return `${day}/${month}/${year} ${hh}:${mm}`;
};

/**
 * Convert a UTC ISO string into an IST wall-time string suitable for <input type="datetime-local" />
 * Format: YYYY-MM-DDTHH:mm
 */
export const utcIsoToIstDateTimeLocal = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = pad2(ist.getUTCMonth() + 1);
  const day = pad2(ist.getUTCDate());
  const hh = pad2(ist.getUTCHours());
  const mm = pad2(ist.getUTCMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

/**
 * Interpret a <input type="datetime-local" /> value as IST wall time and convert to UTC ISO.
 */
export const istDateTimeLocalToUtcIso = (value?: string) => {
  if (!value) return undefined;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return undefined;

  const [yStr, mStr, dStr] = datePart.split("-");
  const [hhStr, mmStr] = timePart.split(":");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const hh = Number(hhStr);
  const mm = Number(mmStr);

  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !Number.isFinite(hh) ||
    !Number.isFinite(mm)
  ) {
    return undefined;
  }

  const utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - IST_OFFSET_MS;
  const iso = new Date(utcMs).toISOString();
  return iso;
};

/**
 * Convenience presets. Returns UTC ISO instants that correspond to IST boundaries.
 * - today: IST midnight -> now
 * - month: IST month start -> now
 * - all: no range
 */
export const presetToDateRangeIST = (preset: TimePreset): DateRange => {
  if (preset === "all") return {};

  const now = new Date();
  const nowUtcMs = now.getTime();
  const nowIst = new Date(nowUtcMs + IST_OFFSET_MS);

  const year = nowIst.getUTCFullYear();
  const month = nowIst.getUTCMonth();
  const day = nowIst.getUTCDate();

  const startIstMs =
    preset === "today"
      ? Date.UTC(year, month, day, 0, 0, 0, 0)
      : Date.UTC(year, month, 1, 0, 0, 0, 0);

  const startUtcMs = startIstMs - IST_OFFSET_MS;

  return {
    startDate: new Date(startUtcMs).toISOString(),
    endDate: now.toISOString(),
  };
};
