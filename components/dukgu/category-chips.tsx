"use client"

interface Chip<T extends string> {
  id: T
  label: string
}

interface CategoryChipsProps<T extends string> {
  chips: Chip<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}

export function CategoryChips<T extends string>({
  chips,
  active,
  onChange,
  className = "",
}: CategoryChipsProps<T>) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChange(chip.id)}
          className={`px-4 py-2 rounded-full text-[12px] font-black transition-all active:scale-95 ${
            active === chip.id
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
              : "bg-white text-slate-500 border border-slate-100"
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
