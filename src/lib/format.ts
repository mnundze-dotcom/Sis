const TZ = "Africa/Johannesburg";

type DateLike = Date | string | null | undefined;

function toDate(value: DateLike): Date | null {
  if (!value) return null;
  const date =
    typeof value === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+02:00` : value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: DateLike): string {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(date)
    : "—";
}

export function formatDateTime(value: DateLike): string {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat("en-ZA", {
        timeZone: TZ,
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(date)
    : "—";
}

export function formatTime(value: DateLike): string {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
    : "—";
}

export function timeAgo(value: DateLike): string {
  const date = toDate(value);
  if (!date) return "—";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(date);
}

/** Today's date in South Africa as YYYY-MM-DD. */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

export function initials(name?: string | null): string {
  const parts = (name ?? "")
    .replace(/[^A-Za-z\u00C0-\u024F\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/** "082 123 4567" → "27821234567" for wa.me links. */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
}

export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
