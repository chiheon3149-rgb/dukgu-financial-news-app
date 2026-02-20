import Link from "next/link"
import { Brain, Gift, ChevronRight } from "lucide-react"

export function TriviaBanner() {
  return (
    <Link href="/trivia" className="block group relative overflow-hidden rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
      
      {/* 1. 배경: 에메랄드 & 틸(청록색) 그라데이션 + 유리 질감 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/90 via-green-500/90 to-teal-500/90 backdrop-blur-sm border border-white/20"></div>

      {/* 2. 배경 장식: 은은하게 비치는 뇌섹남(?) 아이콘 */}
      <Brain className="absolute -top-2 right-10 text-white/20 w-16 h-16 rotate-12 pointer-events-none" />

      {/* 3. 컨텐츠 영역 */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-5">
         
         {/* 왼쪽: 텍스트 */}
         <div>
           <div className="flex items-center gap-2 mb-1.5">
             {/* 기존 고양이 이모지 대신 세련된 뇌 아이콘 사용 */}
             <Brain className="w-5 h-5 text-white drop-shadow-sm" />
             <h3 className="font-extrabold text-white text-lg drop-shadow-md leading-none">
               덕구의 상식 퀴즈
             </h3>
           </div>
           <p className="text-xs text-green-100 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
             <span>오늘의 퀴즈 풀고 렙업하기</span>
             <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
           </p>
         </div>

         {/* 오른쪽: 통통 튀는 선물 상자 아이콘 */}
         <div className="bg-white/25 p-3 rounded-full backdrop-blur-md border border-white/30 shadow-md animate-bounce">
           <Gift className="w-7 h-7 text-white drop-shadow-md" />
         </div>
      </div>
    </Link>
  )
}