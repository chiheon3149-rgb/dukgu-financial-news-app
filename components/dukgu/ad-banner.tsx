"use client"

import { ExternalLink, Megaphone, ArrowRight } from "lucide-react"

export function AdBanner() {
  return (
    // 💡 NewsCard보다 도톰한 py-4 적용, 곡률을 살짝 더 주어 부드럽게 강조
    <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 py-6 px-5 shadow-sm transition-all hover:shadow-md hover:border-amber-100 active:scale-[0.99] cursor-pointer flex flex-col text-left">
      
      {/* 1. 상단: 광고 뱃지 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter bg-amber-100/50 text-amber-700 border border-amber-200/50">
            Sponsored
          </span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
      </div>

      {/* 2. 제목: 뉴스 헤드라인과 결을 맞춘 15px 굵은 서체 */}
      <h3 className="text-[15px] font-black text-slate-900 leading-snug mb-1.5 group-hover:text-amber-600 transition-colors line-clamp-2">
        덕구의 뉴스 곳간 — 실시간 경제 지표를 한눈에!
      </h3>

      {/* 3. 본문: 가독성 좋은 12.5px 2줄 요약 */}
      <p className="text-[12.5px] text-slate-600 font-medium leading-[1.5] mb-4 line-clamp-2 break-keep">
        복잡한 시장 흐름을 덕구가 깔끔하게 정리해 드립니다. 오늘의 브리핑부터 실시간 속보까지, 핵심 정보를 지금 바로 만나보세요.
      </p>

      {/* 4. 하단 바 영역: 요청하신 '지금 바로 혜택 확인하기'를 메인으로 배치 */}
      <div className="mt-auto pt-3 border-t border-slate-100/80 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-amber-500 rounded-full p-1 group-hover:scale-110 transition-transform">
            <Megaphone className="w-3 h-3 text-white" />
          </div>
          {/* 💡 기획자님 요청 사항 적용 부분 */}
          <span className="text-[12px] font-black text-amber-600 group-hover:text-amber-700 transition-colors">
            지금 바로 혜택 확인하기
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mr-1">Promotion</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-500 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 배경 장식: 은은한 황금빛 포인트 */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-amber-100/40 to-transparent blur-xl pointer-events-none" />
    </div>
  )
}