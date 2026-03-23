"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "홈" },
  { href: "/write", label: "쓰기" },
  { href: "/archive", label: "기록" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-5 sm:px-5">
      <div className="rounded-[28px] border border-white/60 bg-[rgba(255,248,240,0.92)] p-2 shadow-[0_20px_40px_rgba(78,57,39,0.16)] backdrop-blur">
        <ul className="grid grid-cols-3 gap-2">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-12 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-white/70 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
