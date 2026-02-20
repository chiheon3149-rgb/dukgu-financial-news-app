import Link from "next/link"
import { Cat, Sparkles, Megaphone } from "lucide-react"

export function AdBanner() {
  return (
    <Link href="#" className="block group relative overflow-hidden rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
      
      {/* 배경 (유리 질감 & 황금빛 그라데이션) */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-300/90 via-orange-400/90 to-amber-300/90 backdrop-blur-sm border border-white/20"></div>
      
      {/* 장식 (반짝이 효과) */}
      <Sparkles className="absolute top-2 right-6 text-yellow-100/60 w-6 h-6 animate-pulse" />
      <Sparkles className="absolute bottom-2 left-8 text-yellow-100/40 w-5 h-5 animate-pulse delay-500" />

      {/* 컨텐츠 영역 */}
      <div className="relative z-10 h-16 flex items-center justify-center gap-3 px-4 py-1">
        
        {/* 아이콘: 더 귀엽고 도톰해진 유리구슬 효과 */}
        <div className="bg-white/25 p-2.5 rounded-full backdrop-blur-md border-2 border-white/50 shadow-md group-hover:rotate-12 transition-transform duration-300 shrink-0">
          <Cat className="w-6 h-6 text-white drop-shadow-md" />
        </div>

        {/* 텍스트 영역: 소제목 추가 및 레이아웃 정리 */}
        <div className="flex flex-col items-start justify-center">
           {/* 상단 뱃지 */}
           <div className="flex items-center gap-1 mb-0.5">
            <Megaphone className="w-3 h-3 text-amber-100" />
            <span className="text-[10px] text-amber-100 font-bold bg-orange-600/30 px-1.5 py-0.5 rounded-full leading-none">
              Notice & Ad
            </span>
           </div>
           
          {/* 메인 타이틀 */}
          <p className="text-white font-extrabold text-lg drop-shadow-lg leading-none pb-0.5">
            덕구의 뉴스 곳간
          </p>
          
          {/* 🆕 추가된 소제목 */}
          <p className="text-[11px] text-amber-50/90 font-medium leading-tight drop-shadow-sm">
            다양한 뉴스를 이곳에서 확인하세요
          </p>
        </div>

      </div>
    </Link>
  )
}