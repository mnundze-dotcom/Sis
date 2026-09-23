export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "safety@sis-app.co.za";

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

const PROVINCE_SUFFIXES: ReadonlyArray<readonly [string, string]> = [
  ["GP", "Gauteng"],
  ["ZN", "KwaZulu-Natal"],
  ["EC", "Eastern Cape"],
  ["FS", "Free State"],
  ["MP", "Mpumalanga"],
  ["NW", "North West"],
  ["NC", "Northern Cape"],
  ["WP", "Western Cape"],
  ["L", "Limpopo"],
];

export function normalizePlate(input: string): string {
  return String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function splitSuffix(plate: string): { core: string; suffix: string; province: string } | null {
  for (const [suffix, province] of PROVINCE_SUFFIXES) {
    const core = plate.slice(0, -suffix.length);
    if (plate.length > suffix.length + 2 && plate.endsWith(suffix) && /\d/.test(core)) return { core, suffix, province };
  }
  return null;
}

/** Best-effort province detection from South African plate formats. */
export function detectProvince(input: string): string | null {
  const plate = normalizePlate(input);
  if (plate.length < 4) return null;
  const split = splitSuffix(plate);
  if (split) return split.province;
  if (/^C[A-Z]{1,2}\d{3,6}$/.test(plate)) return "Western Cape";
  if (/^N[A-Z]{1,2}\d{3,6}$/.test(plate)) return "KwaZulu-Natal";
  return null;
}

/** "CA123456" → "CA 123-456", "BC12DFGP" → "BC 12 DF GP". */
export function formatPlate(input: string): string {
  const plate = normalizePlate(input);
  if (!plate) return "";
  const split = splitSuffix(plate);
  const core = split ? split.core : plate;
  if (!split) {
    const six = core.match(/^([A-Z]{1,3})(\d{3})(\d{3})$/);
    if (six) return `${six[1]} ${six[2]}-${six[3]}`;
  }
  const runs = core.match(/[A-Z]+|\d+/g) ?? [core];
  return [...runs, split?.suffix ?? ""].filter(Boolean).join(" ");
}

export const CATEGORIES = [
  { value: "sexual_offence", label: "Sexual assault or misconduct", short: "Sexual offence" },
  { value: "gbv", label: "Gender-based violence or protection order", short: "GBV" },
  { value: "harassment", label: "Harassment, stalking or intimidation", short: "Harassment" },
  { value: "robbery", label: "Robbery, hijacking or theft", short: "Robbery" },
  { value: "unsafe", label: "Unsafe or suspicious behaviour", short: "Suspicious behaviour" },
] as const;

export const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Elevated" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const VERIFICATION_LEVELS = [
  {
    value: "community",
    label: "Community reported",
    description: "Reviewed by Sis moderators and based on member reports, without official documents.",
  },
  {
    value: "verified",
    label: "Evidence verified",
    description: "Moderators reviewed supporting evidence such as a SAPS case number or a protection order.",
  },
  {
    value: "official",
    label: "Official source",
    description: "Linked to a public SAPS or court record.",
  },
] as const;

export const PLATFORMS = [
  "E-hailing (Uber, Bolt, inDrive…)",
  "Minibus taxi",
  "Metered or private taxi",
  "Lift club / shared ride",
  "Private vehicle",
  "Other",
] as const;

export const DISPUTE_RELATIONSHIPS = [
  { value: "subject", label: "I am the person described" },
  { value: "owner", label: "I own, or used to own, this vehicle" },
  { value: "representative", label: "I'm a legal representative" },
  { value: "other", label: "Other" },
] as const;

export const DISPUTE_REASONS = [
  { value: "wrong_vehicle", label: "Wrong vehicle or plate" },
  { value: "vehicle_sold", label: "The vehicle was sold or not in my possession" },
  { value: "did_not_happen", label: "The events described did not happen" },
  { value: "outdated", label: "The information is outdated" },
  { value: "privacy", label: "It contains private information" },
  { value: "other", label: "Something else" },
] as const;

type Option = { readonly value: string; readonly label: string };
const labelOf = (list: readonly Option[], value: string) => list.find((o) => o.value === value)?.label ?? value;

export const hasOption = (list: readonly Option[], value: string) => list.some((o) => o.value === value);
export const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.short ?? value;
export const categoryLongLabel = (value: string) => labelOf(CATEGORIES, value);
export const riskLabel = (value: string) => labelOf(RISK_LEVELS, value);
export const verificationLabel = (value: string) => labelOf(VERIFICATION_LEVELS, value);
export const disputeReasonLabel = (value: string) => labelOf(DISPUTE_REASONS, value);
export const relationshipLabel = (value: string) => labelOf(DISPUTE_RELATIONSHIPS, value);
