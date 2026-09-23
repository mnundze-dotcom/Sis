"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookUser, Flag, ScanLine, ShieldCheck, UserRound } from "lucide-react";
import { cx } from "./ui";

const LINKS = [
  { href: "/", label: "Check a plate" },
  { href: "/report", label: "Report" },
  { href: "/registry", label: "Registry" },
  { href: "/wanted", label: "SAPS Wanted" },
  { href: "/safety", label: "Safety" },
  { href: "/guidelines", label: "Guidelines" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

export function DesktopNav({ moderator }: { moderator: boolean }) {
  const path = usePathname() ?? "/";
  const links = moderator ? [...LINKS, { href: "/moderation", label: "Moderation" }] : LINKS;
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cx(
            "rounded-full px-3.5 py-2 text-[13.5px] font-medium transition",
            isActive(path, link.href) ? "bg-plum-950 text-white" : "text-ink-soft hover:bg-plum-50 hover:text-ink",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname() ?? "/";
  const tabs = [
    { href: "/", label: "Check", icon: ScanLine },
    { href: "/report", label: "Report", icon: Flag },
    { href: "/registry", label: "Registry", icon: BookUser },
    { href: "/safety", label: "Safety", icon: ShieldCheck },
    { href: signedIn ? "/account" : "/login", label: signedIn ? "Account" : "Sign in", icon: UserRound },
  ];
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href) || (href === "/account" && path.startsWith("/moderation"));
          return (
            <Link
              key={label}
              href={href}
              className={cx("flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10.5px] font-medium", active ? "text-plum-800" : "text-muted")}
            >
              <span className={cx("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-plum-100")}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
