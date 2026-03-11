"use client"

// 💡 입구 확장: 한국 리포트가 있는지 확인하는 'isKrAvailable'을 추가합니다.
interface MarketSwitcherProps {
  mode: "US" | "KR";
  setMode: (mode: "US" | "KR") => void;
  isKrAvailable?: boolean; 
}

export function MarketSwitcher({ mode, setMode, isKrAvailable = true }: MarketSwitcherProps) {
  return (
    <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-6">
      {/* 🇺🇸 미국 버튼 */}
      <button
        onClick={() => setMode("US")}
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${
          mode === "US"
            ? "bg-white text-emerald-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        🇺🇸 Global (Morning)
      </button>

      {/* 🇰🇷 한국 버튼 */}
      <button
        onClick={() => { if (isKrAvailable) setMode("KR") }}
        disabled={!isKrAvailable}
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 relative ${
          mode === "KR"
            ? "bg-white text-emerald-600 shadow-sm"
            : isKrAvailable
              ? "text-slate-500 hover:text-slate-700"
              : "text-slate-400/50 cursor-not-allowed"
        }`}
      >
        🇰🇷 K-Market (Afternoon)
        {!isKrAvailable && (
          <span className="ml-1.5 text-[9px] font-bold text-slate-400/60 align-middle">준비중</span>
        )}
      </button>
    </div>
  )
}