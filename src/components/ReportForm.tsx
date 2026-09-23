"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CircleCheck, ImagePlus, Info, LoaderCircle, X } from "lucide-react";
import { submitReportAction } from "@/app/actions/reports";
import { CATEGORIES, PLATFORMS, PROVINCES, detectProvince, formatPlate } from "@/lib/domain";
import { todayIso } from "@/lib/format";
import { fileToJpegDataUrl } from "@/lib/ocr";
import { PlateReaderButtons } from "./PlateReader";
import { buttonClass } from "./ui";
import { useServerForm } from "./useServerForm";

export default function ReportForm({ initialPlate }: { initialPlate: string }) {
  const { state, pending, onSubmit } = useServerForm(submitReportAction);
  const [plate, setPlate] = useState(initialPlate ? formatPlate(initialPlate) : "");
  const [province, setProvince] = useState<string>(detectProvince(initialPlate) ?? "");
  const [readNote, setReadNote] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  if (state?.success) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9f6ef] text-[#1f6b47]">
          <CircleCheck className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h2 className="mt-5 font-display text-[36px] leading-tight text-ink">Thank you, sis.</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">{state.success}</p>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
          Moderators usually review reports within 48 hours. You can follow its status from your account.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/account" className={buttonClass("primary", "md")}>View my reports</Link>
          <Link href="/" className={buttonClass("secondary", "md")}>Check another plate</Link>
        </div>
      </div>
    );
  }

  function updatePlate(value: string) {
    setPlate(value);
    const detected = detectProvince(value);
    if (detected) setProvince(detected);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Section number="01" title="The vehicle" description="Scan the plate or type it in — this is how other women will find your report.">
        <Field label="Number plate" required>
          <input
            name="plate"
            value={plate}
            onChange={(e) => updatePlate(e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, ""))}
            placeholder="CA 123-456"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={14}
            className="field font-mono text-[18px] font-semibold uppercase tracking-[0.14em]"
          />
        </Field>
        <div className="mt-3">
          <PlateReaderButtons
            onRead={(read) => {
              updatePlate(formatPlate(read.text));
              setReadNote("Plate read from your camera. Please double-check every character.");
            }}
            onStatus={setReadNote}
          />
          {readNote && (
            <p className="mt-2 flex items-start gap-2 text-[12.5px] text-ink-soft">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-plum-500" />
              {readNote}
            </p>
          )}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Make & model">
            <input name="vehicleMake" placeholder="e.g. Toyota Corolla" maxLength={60} className="field" />
          </Field>
          <Field label="Colour">
            <input name="vehicleColour" placeholder="e.g. White" maxLength={30} className="field" />
          </Field>
          <Field label="Province">
            <select name="province" value={province} onChange={(e) => setProvince(e.target.value)} className="field">
              <option value="">Select…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section number="02" title="The driver" description="Only include what you know. Leave the name blank if you're not sure — a description helps just as much.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name shown on the app" hint="Optional. First name is fine.">
            <input name="driverName" placeholder="e.g. Sipho" maxLength={80} className="field" />
          </Field>
          <Field label="Description" hint="Age, build, distinguishing features.">
            <input name="driverDescription" placeholder="e.g. Male, 30s, beard, grey cap" maxLength={400} className="field" />
          </Field>
        </div>
        <div className="mt-4">
          <PhotoField name="driverPhoto" label="Driver photo" hint="Optional. Only the driver — no passengers or bystanders." />
        </div>
      </Section>

      <Section number="03" title="What happened" description="Stick to the facts: when, where, and what the driver said or did.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type of incident" required>
            <select name="category" defaultValue="" className="field">
              <option value="" disabled>Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Type of ride">
            <select name="platform" defaultValue="" className="field">
              <option value="">Select…</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input name="incidentDate" type="date" max={todayIso()} className="field" />
          </Field>
          <Field label="Area" hint="Suburb or town only — never your home address.">
            <input name="incidentArea" placeholder="e.g. Sandton" maxLength={120} className="field" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="What happened?" required hint={`${description.length}/3000 · at least 40 characters`}>
            <textarea
              name="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              placeholder="Describe what the driver said or did, in order. Leave out anything that could identify you or other passengers."
              className="field resize-y"
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="SAPS case number" hint="Optional, but reports with a CAS number can be marked Evidence verified.">
            <input name="sapsCaseNumber" placeholder="e.g. CAS 123/04/2026" maxLength={60} className="field" />
          </Field>
          <PhotoField name="evidencePhoto" label="Evidence" hint="Optional. e.g. a trip receipt screenshot." />
        </div>
      </Section>

      <Section number="04" title="Declaration">
        <label className="flex items-start gap-3 rounded-2xl border border-line bg-plum-50/50 p-4 text-[13.5px] leading-relaxed text-ink-soft">
          <input type="checkbox" name="declaration" className="mt-1 h-4 w-4 shrink-0 accent-[#5d2d79]" />
          <span>
            I confirm this report is truthful and based on my own experience or something I directly witnessed. I&apos;ve read the{" "}
            <Link href="/guidelines" target="_blank" className="font-medium text-plum-700 underline underline-offset-4">Community Guidelines</Link>{" "}
            and understand that knowingly false reports can be unlawful.
          </span>
        </label>
        {state?.error && <p className="mt-4 rounded-xl bg-[#fdeeee] px-4 py-3 text-[13.5px] font-medium text-[#a4262c]">{state.error}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass("accent", "lg")}>
            {pending && <LoaderCircle className="animate-spin" />}
            {pending ? "Submitting…" : "Submit for review"}
          </button>
          <p className="text-[12.5px] text-muted">Nothing is published until a moderator approves it.</p>
        </div>
      </Section>
    </form>
  );
}

function Section({ number, title, description, children }: { number: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[12px] font-medium text-blush-600">{number}</span>
        <div>
          <h2 className="font-display text-[28px] leading-none text-ink">{title}</h2>
          {description && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-blush-600"> *</span>}
      </span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function PhotoField({ name, label, hint }: { name: string; label: string; hint: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      setValue(await fileToJpegDataUrl(file, 720, 0.78));
    } catch {
      setError("That image couldn't be read. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-[74px] w-[74px] rounded-xl object-cover ring-1 ring-line" />
          <button type="button" onClick={() => setValue("")} className={buttonClass("ghost", "sm")}>
            <X />
            Remove
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-plum-200 bg-plum-50/40 px-4 py-3.5 text-[13px] text-ink-soft transition hover:border-plum-300 hover:bg-plum-50">
          {busy ? <LoaderCircle className="h-5 w-5 animate-spin text-plum-500" /> : <ImagePlus className="h-5 w-5 text-plum-500" strokeWidth={1.5} />}
          <span>
            {busy ? "Processing…" : "Add a photo"}
            <span className="block text-[12px] text-muted">{hint}</span>
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
      )}
      {error && <span className="hint text-[#b42318]">{error}</span>}
    </div>
  );
}
