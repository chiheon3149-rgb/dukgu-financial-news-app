"use client"

import { useEffect } from "react"
import { Megaphone, ArrowRight } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense In-feed error:", e);
    }
  }, []);

  return (
    <div className="w-full px-4 mb-6"> {/* 리스트와 간격을 위한 마진 추가 */}
      <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 1. 광고 본체 영역: 패딩을 줄여서 광고가 꽉 차게 배치 */}
        <div className="relative z-10 p-0 font-[family-name:var(--font-noto)]">
          <ins className="adsbygoogle"
               style={{ display: 'block', minWidth: '250px' }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h"
               data-ad-client="ca-pub-4762124054224861"
               data-ad-slot="1458725046"
          ></ins>
        </div>

        {/* 2. 하단 디자인 바: 광고의 '사이트 방문' 버튼과 시너지를 낼 수 있게 정돈 */}
        <div className="px-5 py-3 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-500 rounded-full p-1 group-hover:rotate-12 transition-transform">
              <Megaphone className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              덕구가 선별한 추천 파트너사입니다
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        </div>

        {/* 장식용 그라데이션 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/30 blur-3xl -z-10" />
      </div>
    </div>
  )
}