"use client"

// 💡 기획자님, 나중에 옵션을 늘리고 싶으면 이 배열만 수정하면 됩니다!
const EMOJI_OPTIONS = ["🐱", "🐶", "🦊", "🦁", "🐼", "🐻", "🐰", "🐯", "🐨", "🐹"]

interface AvatarPickerProps {
  selectedEmoji: string
  onSelect: (emoji: string) => void
}

export function AvatarPicker({ selectedEmoji, onSelect }: AvatarPickerProps) {
  return (
    <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 text-center">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">캐릭터 선택</p>
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl border-4 border-emerald-500 shadow-inner">
          {selectedEmoji}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={`py-3 text-2xl rounded-2xl transition-all active:scale-90 ${
              selectedEmoji === emoji 
                ? "bg-emerald-500 shadow-md transform -translate-y-1" 
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </section>
  )
}