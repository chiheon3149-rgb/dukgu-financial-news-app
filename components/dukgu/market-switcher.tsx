"use client"

// 💡 입구 확장: 한국 리포트가 있는지 확인하는 'isKrAvailable'을 추가합니다.
interface MarketSwitcherProps {
  mode: "US" | "KR";
  setMode: (mode: "US" | "KR") => void;
  isKrAvailable?: boolean; 
}

export function MarketSwitcher({ mode, setMode, isKrAvailable = true }: MarketSwitcherProps) {
  return (
    <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-6 shadow-inner border border-slate-100">
      {/* 🇺🇸 미국 버튼 (항상 활성화 - 오전 리포트는 항상 먼저 나오니까요냥!) */}
      <button
        onClick={() => setMode("US")}
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${
          mode === "US" 
            ? "bg-white text-emerald-600 shadow-md transform scale-[1.02]" 
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        🇺🇸 Global (Morning)
      </button>

      {/* 🇰🇷 한국 버튼 (isKrAvailable 상태에 따라 반응함) */}
      <button
        onClick={() => {
          // 💡 기획 포인트: 한국 리포트가 있을 때만 클릭이 먹히게 합니다.
          if (isKrAvailable) setMode("KR");
        }}
        disabled={!isKrAvailable} // HTML 차원에서도 버튼을 잠급니다.
        className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 relative ${
          mode === "KR" 
            ? "bg-white text-emerald-600 shadow-md transform scale-[1.02]" 
            : "text-slate-500"
        } ${
          !isKrAvailable 
            ? "opacity-30 grayscale cursor-not-allowed" // 💡 비활성화 시: 흐리고, 회색조에, 금지 마우스 포인터
            : "hover:text-slate-700"
        }`}
      >
        🇰🇷 K-Market (Afternoon)
        
        {/* 💡 기획자님의 센스: 아직 배포 전이면 아주 작게 '준비중' 표시를 띄울 수도 있어요. */}
        {!isKrAvailable && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
          </span>
        )}
      </button>
    </div>
  )
}