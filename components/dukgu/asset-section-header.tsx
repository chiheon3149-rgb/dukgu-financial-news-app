import { Plus } from "lucide-react"

interface Props {
  title: string
  count: number
  barClass?: string     // e.g. "bg-indigo-500"
  buttonClass?: string  // e.g. "text-indigo-600 bg-indigo-50"
  onToggle: () => void
}

export function AssetSectionHeader({
  title,
  count,
  barClass = "bg-slate-500",
  buttonClass = "text-slate-600 bg-slate-50",
  onToggle,
}: Props) {
  return (
    <div className="flex items-center justify-between px-1">
      <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
        <span className={`w-1.5 h-4 ${barClass} rounded-full`} />
        {title} ({count})
      </h3>
      <button
        onClick={onToggle}
        className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-full transition-all active:scale-95 ${buttonClass}`}
      >
        <Plus className="w-3 h-3" /> 추가
      </button>
    </div>
  )
}
