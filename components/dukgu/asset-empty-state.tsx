import type { LucideIcon } from "lucide-react"

interface Props {
  icon: LucideIcon
  message: string
}

export function AssetEmptyState({ icon: Icon, message }: Props) {
  return (
    <div className="py-16 text-center text-slate-300 bg-white rounded-[24px] border border-dashed border-slate-200">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm font-bold">{message}</p>
    </div>
  )
}
