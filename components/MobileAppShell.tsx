"use client";

import Link from "next/link";
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

export default function MobileAppShell() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => void navigator.serviceWorker.register("/sw.js");
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

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
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                active ? "text-[#c55f38]" : "text-[#718078]"
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-[#f5ded4]" : ""}`}>
                <svg aria-hidden="true" viewBox="0 0 20 22" className="h-5 w-5 fill-none stroke-current stroke-[1.7] stroke-linecap-round stroke-linejoin-round">
                  {item.icon}
                </svg>
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
