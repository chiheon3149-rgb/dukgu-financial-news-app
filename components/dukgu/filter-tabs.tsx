"use client"

interface FilterTabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface FilterTabsProps {
  tabs: FilterTabItem[]
  value: string
  onChange: (id: string) => void
}

/**
 * 화면 너비를 균등 분할하는 필터 탭 컴포넌트.
 * tabs 배열 길이에 따라 자동으로 그리드 열 수를 결정합니다.
 */
export function FilterTabs({ tabs, value, onChange }: FilterTabsProps) {
  return (
    <div
      className="w-full grid gap-2"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center justify-center gap-1.5 h-[34px] rounded-full text-[12px] transition-all active:scale-95 ${
            value === tab.id
              ? "bg-[#00C48C] text-white font-bold"
              : "bg-slate-100 text-slate-500 font-medium border border-slate-200"
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
