import Link from "next/link";

type AppLogoProps = {
  compact?: boolean;
};

export default function AppLogo({ compact = false }: AppLogoProps) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 text-[#22211F]"
      aria-label="Expense Tracker AI home"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-[14px] bg-[#1f382b] font-semibold text-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md ${
          compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
        }`}
      >
        ET
      </span>
      <span className="leading-none">
        <span
          className={`block font-semibold tracking-[-0.01em] ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          Expense <span className="text-[#c55f38]">Tracker</span>
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8176]">
          Thoughtful money
        </span>
      </span>
    </Link>
  );
}
