"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  Info,
  LoaderCircle,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ScanLine,
  Share2,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { checkPlate, type CheckResult, type SourceStatus } from "@/app/actions/scan";
import { categoryLongLabel, detectProvince, formatPlate, normalizePlate } from "@/lib/domain";
import { formatDate, formatTime, waNumber } from "@/lib/format";
import { PlateReaderButtons, type PlateRead } from "./PlateReader";
import { Avatar, CategoryChip, Chip, RecordStatusChip, RiskChip, SampleChip, VerificationChip, buttonClass, cx } from "./ui";

type Contact = { id: number; name: string; phone: string };
type Method = "manual" | "camera" | "photo";

export default function Scanner({ contacts, signedIn }: { contacts: Contact[]; signedIn: boolean }) {
  const [plate, setPlate] = useState("");
  const [method, setMethod] = useState<Method>("manual");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [checking, startTransition] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);
  const province = detectProvince(plate);

  function run(event?: FormEvent) {
    event?.preventDefault();
    const normalized = normalizePlate(plate);
    if (normalized.length < 4) {
      setError("Enter the full number plate, e.g. CA 123-456 or BC 12 DF GP.");
      return;
    }
    setError(null);
    setAlternatives([]);
    startTransition(async () => {
      const response = await checkPlate(normalized, method);
      if ("error" in response) {
        setError(response.error);
        setResult(null);
        return;
      }
      setResult(response);
      setStatus(null);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    });
  }

  function onRead(read: PlateRead) {
    setPlate(formatPlate(read.text));
    setMethod(read.method);
    setAlternatives(read.candidates.filter((c) => c !== read.text).slice(0, 3));
    setStatus("Check that the characters match the plate, then tap Check plate.");
    setResult(null);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="card relative overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <ScanLine className="h-4 w-4 text-blush-500" strokeWidth={1.75} />
            Check a number plate
          </p>
          <span className="text-[12px] text-muted">{province ?? "South Africa"}</span>
        </div>

        <label htmlFor="plate" className="sr-only">Number plate</label>
        <div className="mt-4 flex items-stretch overflow-hidden rounded-[14px] border-2 border-ink bg-white shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_4px_rgba(28,16,34,0.12)] transition focus-within:border-plum-700 focus-within:shadow-[0_0_0_5px_var(--color-plum-100)]">
          <div className="flex w-11 shrink-0 flex-col items-center justify-center gap-1 bg-plum-950 text-white">
            <span className="text-[9px] font-semibold tracking-[0.2em]">ZA</span>
            <span className="h-1 w-4 rounded-full bg-sis" />
          </div>
          <input
            id="plate"
            value={plate}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, "");
              setPlate(value);
              if (!value) setMethod("manual");
            }}
            placeholder="CA 123-456"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={14}
            className="min-w-0 flex-1 bg-transparent px-3 py-4 text-center font-mono text-[25px] font-semibold uppercase tracking-[0.14em] text-ink outline-none placeholder:text-ink/15 sm:text-[29px]"
          />
        </div>

        {alternatives.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
            Or did it say
            {alternatives.map((alt) => (
              <button
                type="button"
                key={alt}
                onClick={() => {
                  setPlate(formatPlate(alt));
                  setAlternatives([]);
                }}
                className="rounded-full border border-line bg-white px-2.5 py-1 font-mono text-[12px] text-ink transition hover:border-plum-300"
              >
                {formatPlate(alt)}
              </button>
            ))}
          </div>
        )}

        <button type="submit" disabled={checking} className={buttonClass("primary", "lg", "mt-4 w-full")}>
          {checking ? <LoaderCircle className="animate-spin" /> : null}
          {checking ? "Checking sources…" : "Check plate"}
          {!checking && <ArrowRight />}
        </button>
        <div className="mt-2.5">
          <PlateReaderButtons onRead={onRead} onStatus={setStatus} />
        </div>

        {status && (
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-plum-500" />
            {status}
          </p>
        )}
        {error && <p className="mt-3 text-[13px] font-medium text-[#b42318]">{error}</p>}

        <p className="mt-5 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
          Checks are private — drivers are never notified.{" "}
          {signedIn ? "Your checks are saved to your account." : "Sign in to keep a history of your checks."}
        </p>
      </form>

      {result && (
        <div ref={resultRef} className="scroll-mt-24 space-y-4">
          {result.outcome === "match" && result.record ? (
            <MatchCard result={result} />
          ) : result.outcome === "caution" ? (
            <CautionCard result={result} />
          ) : (
            <ClearCard result={result} />
          )}
          <SourcesCard result={result} />
          <ShareCard result={result} contacts={contacts} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</dt>
      <dd className="mt-1 text-white/90">{value}</dd>
    </div>
  );
}

function MatchCard({ result }: { result: CheckResult }) {
  const r = result.record;
  if (!r) return null;
  const vehicle = [r.vehicleColour, r.vehicleMake].filter(Boolean).join(" ");
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-plum-950 p-6 text-white shadow-[0_30px_60px_-30px_rgba(29,12,42,0.85)] sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blush-500/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-blush-500/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-blush-200 ring-1 ring-blush-400/30">
            <ShieldAlert className="h-3.5 w-3.5" />
            Match found
          </span>
          <span className="text-[12px] text-white/50">Checked {formatTime(result.checkedAt)}</span>
        </div>
        <h3 className="mt-5 font-display text-[44px] leading-none">Do not get in.</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-white/70">
          {formatPlate(result.plate)} matches a moderated record on Sis. Cancel the trip and wait somewhere safe and busy.
        </p>

        <div className="mt-6 flex gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
          <Avatar name={r.displayName} src={r.photoUrl} size={84} dark />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold leading-snug">{r.displayName ?? "Driver identity unknown"}</p>
            {r.driverDescription && <p className="mt-1 text-[13px] leading-relaxed text-white/65">{r.driverDescription}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <CategoryChip category={r.category} dark />
              <RiskChip level={r.riskLevel} />
              <VerificationChip level={r.verification} dark />
              <RecordStatusChip status={r.status} />
              {r.isSample && <SampleChip dark />}
            </div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
          <Detail label="Vehicle" value={vehicle || "—"} />
          <Detail label="Province" value={r.province ?? result.province ?? "—"} />
          <Detail label="Reports" value={`${r.reportCount} moderated`} />
          <Detail label="Last updated" value={formatDate(r.updatedAt)} />
        </dl>

        <p className="mt-5 border-t border-white/10 pt-5 text-[14.5px] leading-relaxed text-white/80">{r.summary}</p>

        {result.sapsMatches.length > 0 && (
          <div className="mt-5 rounded-2xl bg-blush-500/10 p-4 ring-1 ring-blush-400/30">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-blush-100">
              <TriangleAlert className="h-4 w-4" />
              Possible SAPS wanted-list name match
            </p>
            <div className="mt-3 space-y-2">
              {result.sapsMatches.map((m) => (
                <Link key={m.bid} href={`/wanted/${m.bid}`} className="flex items-center gap-3 rounded-xl bg-white/5 p-2 transition hover:bg-white/10">
                  {m.photoId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/saps/photo/${m.photoId}`} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <span className="text-[13px]">
                    <span className="font-medium text-white">{m.fullName}</span>
                    <span className="block text-white/60">{m.crime}</span>
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-white/50" />
                </Link>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-white/50">Names can be shared by different people. Never act on a name match alone.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <a href="tel:10111" className={buttonClass("accent", "md")}>
            <Phone />
            Call SAPS 10111
          </a>
          <Link href={`/registry/${r.id}`} className={buttonClass("light", "md")}>
            View full record
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CautionCard({ result }: { result: CheckResult }) {
  return (
    <div className="card border-[#f3dfb1] bg-[#fffaf0] p-6 sm:p-7">
      <Chip tone="warning">
        <Clock3 strokeWidth={2} />
        Reports under review
      </Chip>
      <h3 className="mt-4 font-display text-[36px] leading-none text-ink">Proceed with caution.</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
        {result.pendingReports === 1 ? "A report" : `${result.pendingReports} reports`} about {formatPlate(result.plate)}{" "}
        {result.pendingReports === 1 ? "is" : "are"} being reviewed by our moderators. Details stay hidden until verified — if you
        can, wait for another vehicle.
      </p>
      <Link href={`/report?plate=${result.plate}`} className={buttonClass("secondary", "sm", "mt-5")}>
        Had an experience with this driver?
      </Link>
    </div>
  );
}

function ClearCard({ result }: { result: CheckResult }) {
  return (
    <div className="card p-6 sm:p-7">
      <Chip tone="success">
        <CircleCheck strokeWidth={2} />
        No records found
      </Chip>
      <h3 className="mt-4 font-display text-[36px] leading-none text-ink">Nothing on record.</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
        {formatPlate(result.plate)} isn&apos;t on the Sis registry or under review. That isn&apos;t a guarantee of safety — confirm the
        driver matches the app, sit behind the passenger seat and share your trip.
      </p>
    </div>
  );
}

const SOURCE_UI: Record<SourceStatus, { icon: typeof Info; className: string; label: string }> = {
  hit: { icon: ShieldAlert, className: "text-blush-600", label: "Match" },
  pending: { icon: Clock3, className: "text-[#a86800]", label: "In review" },
  clear: { icon: CircleCheck, className: "text-[#1d8a57]", label: "Clear" },
  unavailable: { icon: Info, className: "text-muted", label: "Unavailable" },
  restricted: { icon: Lock, className: "text-muted", label: "Not public" },
  skipped: { icon: Info, className: "text-muted", label: "Skipped" },
};

function SourcesCard({ result }: { result: CheckResult }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">What we checked</p>
        <Link href="/#sources" className="text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline">
          How checks work
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {result.sources.map((source) => {
          const ui = SOURCE_UI[source.status];
          const Icon = ui.icon;
          return (
            <li key={source.key} className="flex items-start gap-3 py-3">
              <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", ui.className)} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-[13.5px] font-medium text-ink">{source.name}</p>
                  <span className={cx("text-[10.5px] font-semibold uppercase tracking-[0.14em]", ui.className)}>{ui.label}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{source.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function buildMessage(result: CheckResult, location: { lat: number; lng: number } | null): string {
  const r = result.record;
  const vehicle = r ? [r.vehicleColour, r.vehicleMake].filter(Boolean).join(" ") : "";
  const outcome =
    result.outcome === "match" && r
      ? `MATCH on the Sis registry (${categoryLongLabel(r.category)}). I'm not getting in.`
      : result.outcome === "caution"
        ? "Reports about this plate are under review."
        : "No records found on Sis.";
  return [
    `Sis ride check · ${formatTime(result.checkedAt)}`,
    `Plate: ${formatPlate(result.plate)}${vehicle ? ` (${vehicle})` : ""}`,
    `Result: ${outcome}`,
    location ? `My location: https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lng.toFixed(5)}` : null,
    "If you don't hear from me in 30 minutes, please call me.",
  ]
    .filter(Boolean)
    .join("\n");
}

function ShareCard({ result, contacts }: { result: CheckResult; contacts: Contact[] }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");
  const [copied, setCopied] = useState(false);
  const message = buildMessage(result, location);
  const encoded = encodeURIComponent(message);

  function addLocation() {
    if (!navigator.geolocation) {
      setLocating("denied");
      return;
    }
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating("idle");
      },
      () => setLocating("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: message });
      } catch {
        /* dismissed */
      }
      return;
    }
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5 sm:p-6">
      <p className="font-display text-[26px] leading-tight text-ink">Share this ride</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">Send the plate, result and time to someone you trust before the doors close.</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-plum-50 p-3.5 font-sans text-[12.5px] leading-relaxed text-ink-soft">{message}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={addLocation} className={buttonClass("secondary", "sm")}>
          {locating === "busy" ? <LoaderCircle className="animate-spin" /> : <MapPin strokeWidth={1.75} />}
          {location ? "Location added" : locating === "denied" ? "Location unavailable" : "Add my location"}
        </button>
        <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
          <MessageCircle strokeWidth={1.75} />
          WhatsApp
        </a>
        <a href={`sms:?&body=${encoded}`} className={buttonClass("secondary", "sm")}>
          SMS
        </a>
        <button type="button" onClick={share} className={buttonClass("secondary", "sm")}>
          <Share2 strokeWidth={1.75} />
          {copied ? "Copied" : "Share…"}
        </button>
      </div>
      {contacts.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Trusted contacts</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contacts.map((c) => (
              <a key={c.id} href={`https://wa.me/${waNumber(c.phone)}?text=${encoded}`} target="_blank" rel="noreferrer" className={buttonClass("accent", "sm")}>
                <MessageCircle strokeWidth={1.75} />
                Send to {c.name}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">
          Save up to 5 trusted contacts in the{" "}
          <Link href="/safety#contacts" className="font-medium text-plum-700 underline underline-offset-4">
            Safety toolkit
          </Link>{" "}
          for one-tap sharing.
        </p>
      )}
    </div>
  );
}
