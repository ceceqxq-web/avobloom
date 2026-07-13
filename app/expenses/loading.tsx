export default function ExpensesLoading() {
  return (
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-7 text-[#22211F] sm:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-9 w-36 rounded-full bg-[#e5e1d9]" />
          <div className="h-10 w-24 rounded-full bg-[#e5e1d9]" />
        </div>
        <div className="mb-7">
          <div className="h-3 w-16 rounded bg-[#ddd8cf]" />
          <div className="mt-3 h-9 w-40 rounded bg-[#ddd8cf]" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-2xl border border-[#e3ded5] bg-white/70" />
          ))}
        </div>
      </div>
    </main>
  );
}
