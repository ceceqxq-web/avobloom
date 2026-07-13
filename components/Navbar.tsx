import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-[#E4E7EC] bg-white px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#667085]"
        >
          ET AI
        </Link>

        <div className="flex gap-4 text-sm text-[#1D1F23]">
          <Link href="/">Home</Link>
          <Link href="/expenses">Expenses</Link>
          <Link href="/reports">Reports</Link>
        </div>
      </div>
    </nav>
  );
}
