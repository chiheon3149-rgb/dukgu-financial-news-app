"use client"

interface MarketSwitcherProps {
  mode: "US" | "KR";
  setMode: (mode: "US" | "KR") => void;
}

export function MarketSwitcher({ mode, setMode }: MarketSwitcherProps) {
  return (
    <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-6 shadow-inner border border-slate-100">
      <button
        onClick={() => setMode("US")}
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${
          mode === "US" 
            ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" 
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        🇺🇸 미국 (Morning)
      </button>
      <button
        onClick={() => setMode("KR")}
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${
          mode === "KR" 
            ? "bg-white text-rose-600 shadow-md transform scale-[1.02]" 
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        🇰🇷 한국 (Afternoon)
      </button>
    </div>
  )
}