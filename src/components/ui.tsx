import type { ReactNode } from "react";
import { BadgeCheck, Clock3, Scale, ShieldCheck, UserRound, Users } from "lucide-react";
import { categoryLabel, formatPlate, riskLabel, verificationLabel } from "@/lib/domain";
import { initials } from "@/lib/format";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ---------------------------------- Buttons --------------------------------- */

const BUTTON_VARIANTS = {
  primary: "bg-plum-950 text-white shadow-[0_10px_24px_-14px_rgba(29,12,42,0.9)] hover:bg-plum-900",
  accent: "bg-sis text-white shadow-[0_12px_28px_-14px_rgba(207,45,104,0.85)] hover:brightness-110",
  secondary: "border border-line bg-white text-ink hover:border-plum-200 hover:bg-plum-50/60",
  ghost: "text-ink-soft hover:bg-plum-50 hover:text-ink",
  danger: "bg-[#b42318] text-white hover:bg-[#971c13]",
  light: "bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15",
} as const;
const BUTTON_SIZES = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cx(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.005em] transition duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
    BUTTON_SIZES[size],
    BUTTON_VARIANTS[variant],
    extra,
  );
}

/* ----------------------------------- Layout ---------------------------------- */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-5 md:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, tone = "blush", className }: { children: ReactNode; tone?: "blush" | "light"; className?: string }) {
  return (
    <p
      className={cx(
        "flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em]",
        tone === "light" ? "text-blush-200" : "text-blush-600",
        className,
      )}
    >
      <span className="h-px w-6 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-80 w-[36rem] rounded-full bg-plum-100/70 blur-[100px]" />
        <div className="absolute -top-32 right-0 h-72 w-96 rounded-full bg-blush-100/70 blur-[100px]" />
      </div>
      <Container className="py-10 md:py-16">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl font-display text-[42px] leading-[1.02] tracking-[-0.01em] text-ink md:text-[60px]">
          {title}
        </h1>
        {description && <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-soft">{description}</p>}
        {children}
      </Container>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-50 text-plum-600">{icon}</div>}
      <p className="mt-4 font-display text-[26px] leading-tight text-ink">{title}</p>
      {children && <div className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warning"; title?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4 text-[13.5px] leading-relaxed",
        tone === "warning" ? "border-[#f3dfb1] bg-[#fffaf0] text-[#6b4a00]" : "border-plum-100 bg-plum-50/70 text-ink-soft",
      )}
    >
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      {children}
    </div>
  );
}

export function Stat({ value, label, dark }: { value: ReactNode; label: string; dark?: boolean }) {
  return (
    <div>
      <dd className={cx("font-display text-[40px] leading-none", dark ? "text-white" : "text-ink")}>{value}</dd>
      <dt className={cx("mt-2 text-[11.5px] font-medium uppercase tracking-[0.14em]", dark ? "text-white/55" : "text-muted")}>{label}</dt>
    </div>
  );
}

/* ------------------------------------ Chips ---------------------------------- */

const CHIP_TONES = {
  neutral: "bg-plum-50 text-ink-soft ring-plum-100",
  plum: "bg-plum-100/60 text-plum-800 ring-plum-200/70",
  blush: "bg-blush-50 text-blush-700 ring-blush-200/80",
  danger: "bg-[#fdeeee] text-[#a4262c] ring-[#f5cfd0]",
  warning: "bg-[#fff5e1] text-[#8a5a00] ring-[#f3dfb1]",
  success: "bg-[#e9f6ef] text-[#1f6b47] ring-[#c7e7d5]",
  dark: "bg-white/10 text-white/85 ring-white/15",
} as const;
export type ChipTone = keyof typeof CHIP_TONES;

export function Chip({ tone = "neutral", dot, children, className }: { tone?: ChipTone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11.5px] font-medium ring-1 ring-inset [&_svg]:h-3 [&_svg]:w-3",
        CHIP_TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />}
      {children}
    </span>
  );
}

export function RiskChip({ level }: { level: string }) {
  const tone: ChipTone = level === "critical" ? "danger" : level === "high" ? "blush" : level === "medium" ? "warning" : "neutral";
  return (
    <Chip tone={tone} dot>
      {riskLabel(level)} risk
    </Chip>
  );
}

export function VerificationChip({ level, dark }: { level: string; dark?: boolean }) {
  const tone: ChipTone = dark ? "dark" : level === "official" ? "success" : level === "verified" ? "plum" : "neutral";
  const Icon = level === "official" ? ShieldCheck : level === "verified" ? BadgeCheck : Users;
  return (
    <Chip tone={tone}>
      <Icon strokeWidth={2} />
      {verificationLabel(level)}
    </Chip>
  );
}

export function CategoryChip({ category, dark }: { category: string; dark?: boolean }) {
  return <Chip tone={dark ? "dark" : "plum"}>{categoryLabel(category)}</Chip>;
}

export function RecordStatusChip({ status }: { status: string }) {
  if (status === "disputed")
    return (
      <Chip tone="warning">
        <Scale strokeWidth={2} />
        Under dispute
      </Chip>
    );
  if (status === "removed") return <Chip tone="neutral">Removed</Chip>;
  return null;
}

export function ReportStatusChip({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Chip tone="success" dot>Published</Chip>;
    case "rejected":
      return <Chip tone="neutral" dot>Not published</Chip>;
    case "needs_info":
      return <Chip tone="blush" dot>More info needed</Chip>;
    default:
      return (
        <Chip tone="warning">
          <Clock3 strokeWidth={2} />
          Under review
        </Chip>
      );
  }
}

export function DisputeStatusChip({ status }: { status: string }) {
  if (status === "upheld") return <Chip tone="success" dot>Upheld</Chip>;
  if (status === "dismissed") return <Chip tone="neutral" dot>Dismissed</Chip>;
  return <Chip tone="warning" dot>Open</Chip>;
}

export function SampleChip({ dark }: { dark?: boolean }) {
  return (
    <Chip tone={dark ? "dark" : "neutral"} className="border border-dashed border-current/30">
      Sample data
    </Chip>
  );
}

/* ---------------------------------- Identity --------------------------------- */

export function PlateTag({ plate, size = "md", className }: { plate: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "px-2 py-0.5 text-[12px]", md: "px-2.5 py-1 text-[14px]", lg: "px-3.5 py-1.5 text-[20px]" };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[7px] border-[1.5px] border-ink bg-white font-mono font-semibold uppercase tracking-[0.14em] text-ink shadow-[inset_0_0_0_2px_#fff,inset_0_0_0_3px_rgba(28,16,34,0.12)]",
        sizes[size],
        className,
      )}
    >
      {formatPlate(plate)}
    </span>
  );
}

export function Avatar({ name, src, size = 56, dark, className }: { name?: string | null; src?: string | null; size?: number; dark?: boolean; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `Photo of ${name}` : "Driver photo"}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cx("shrink-0 rounded-2xl object-cover ring-1 ring-black/5", className)}
      />
    );
  }
  const unknown = !name || /^unknown/i.test(name) || initials(name) === "?";
  return (
    <div
      style={{ width: size, height: size }}
      className={cx(
        "grid shrink-0 place-items-center rounded-2xl",
        dark ? "bg-white/10 text-white/80 ring-1 ring-white/10" : "bg-plum-100 text-plum-700",
        className,
      )}
      aria-hidden
    >
      {unknown ? (
        <UserRound style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.4} />
      ) : (
        <span className="font-display leading-none" style={{ fontSize: size * 0.4 }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------ Auth ----------------------------------- */

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Container className="py-8 md:py-16">
      <div className="card grid overflow-hidden lg:grid-cols-[1fr_1.05fr]">
        <div className="relative hidden overflow-hidden bg-plum-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-plum-600/50 blur-[90px]" />
          <div aria-hidden className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blush-500/35 blur-[90px]" />
          <p className="relative font-display text-[40px] leading-none">
            Sis<span className="text-blush-400">.</span>
          </p>
          <div className="relative">
            <p className="font-display text-[44px] leading-[1.05]">
              We look out for <em className="text-blush-300">each other.</em>
            </p>
            <ul className="mt-8 space-y-3 text-[14px] text-white/70">
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 shrink-0 text-blush-300" strokeWidth={1.5} />Every report is reviewed by a moderator</li>
              <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-blush-300" strokeWidth={1.5} />Your identity is never shown publicly</li>
              <li className="flex gap-3"><Scale className="h-5 w-5 shrink-0 text-blush-300" strokeWidth={1.5} />Fair process with a right of reply</li>
            </ul>
          </div>
        </div>
        <div className="p-7 sm:p-10 md:p-14">
          <h1 className="font-display text-[42px] leading-none text-ink">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-line pt-6 text-[14px] text-muted">{footer}</div>}
        </div>
      </div>
    </Container>
  );
}
