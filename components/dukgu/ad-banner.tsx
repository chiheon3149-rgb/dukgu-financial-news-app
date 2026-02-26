"use client"

import { useEffect } from "react"
import { Megaphone, ArrowRight } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      // 💡 광고 엔진에 기획자님의 인피드 광고를 호출합니다.
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense In-feed error:", e);
    }
  }, []);

  return (
    <div className="w-full">
      {/* 💡 기획자님의 디자인 레이아웃 컨테이너 */}
      <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-amber-100 active:scale-[0.99] cursor-pointer">
        
        {/* 1. 애드센스 인피드 광고 삽입 영역 */}
        <div className="relative z-10 p-1 font-[family-name:var(--font-noto)]">
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h" // 👈 기획자님의 레이아웃 키 적용
               data-ad-client="ca-pub-4762124054224861" // 👈 기획자님의 게시자 ID 적용
               data-ad-slot="1458725046"           // 👈 기획자님의 슬롯 ID 적용
          ></ins>
        </div>

        {/* 2. 하단 혜택 안내 바 (우리 앱만의 고유 디자인 유지) */}
        <div className="mt-auto px-5 py-4 border-t border-slate-100/80 flex justify-between items-center gap-2 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-500 rounded-full p-1 group-hover:scale-110 transition-transform">
              <Megaphone className="w-3 h-3 text-white" />
            </div>
            <span className="text-[12px] font-black text-amber-600 group-hover:text-amber-700 transition-colors">
              지금 바로 혜택 확인하기
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mr-1">Promotion</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 배경 장식 포인트 */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-amber-100/40 to-transparent blur-xl pointer-events-none" />
      </div>
    </div>
  )
}