"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface DetailHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  // 💡 darkMode가 true면 하얀 글씨, false(기본)면 검은 글씨로 나옵니다.
  isDark?: boolean; 
}

export function DetailHeader({ title, rightElement, onBack, isDark = false }: DetailHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  }

  // 🎨 테마에 따른 색상 결정
  const textColor = isDark ? "text-white" : "text-slate-800";
  const bgColor = isDark ? "bg-white/10" : "bg-white/80";
  const borderColor = isDark ? "border-white/20" : "border-slate-200";
  const btnHover = isDark ? "hover:bg-white/20" : "hover:bg-slate-100";

  return (
    <header className={`sticky top-0 z-50 ${bgColor} backdrop-blur-md border-b ${borderColor} px-4 py-3 flex items-center justify-between shadow-sm transition-colors`}>
      <div className="flex items-center gap-3">
        <button 
          onClick={handleBack} 
          className={`p-1.5 ${btnHover} rounded-full transition-colors active:scale-90`}
        >
          <ArrowLeft className={`w-6 h-6 ${textColor}`} />
        </button>
        <h1 className={`font-bold text-lg ${textColor} drop-shadow-sm tracking-tight`}>
          {title}
        </h1>
      </div>

      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </header>
  )
}