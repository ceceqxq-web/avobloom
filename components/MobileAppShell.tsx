"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const items = [
  {
    href: "/",
    label: "首页",
    icon: <path d="M3 10.5 10 4l7 6.5V18a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1v-7.5Z" />,
  },
  {
    href: "/expenses",
    label: "账单",
    icon: <path d="M5 3h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Zm3 5h4M8 12h4" />,
  },
  {
    href: "/reports",
    label: "报告",
    icon: <path d="M4 18V9m6 9V3m6 15v-6" />,
  },
];

function MobileNavItem({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        className={`grid h-7 w-12 place-items-center rounded-full transition-all duration-150 ${
          active || pending ? "scale-105 bg-[#f5ded4]" : ""
        }`}
      >
        {pending ? (
          <span
            aria-label={`正在打开${label}`}
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#d7a18c] border-t-[#c55f38]"
          />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 22"
            className="h-5 w-5 fill-none stroke-current stroke-[1.7] stroke-linecap-round stroke-linejoin-round"
          >
            {icon}
          </svg>
        )}
      </span>
      <span>{pending ? "载入中" : label}</span>
    </>
  );
}

export default function MobileAppShell() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => void navigator.serviceWorker.register("/sw.js");
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return null;

  return (
    <nav
      aria-label="手机主导航"
      className="mobile-tab-bar fixed inset-x-0 bottom-0 z-50 border-t border-[#d7ded5] bg-[#f9faf6]/95 px-3 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 touch-manipulation select-none flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-95 ${
                active ? "text-[#c55f38]" : "text-[#718078]"
              }`}
            >
              <MobileNavItem active={active} icon={item.icon} label={item.label} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
