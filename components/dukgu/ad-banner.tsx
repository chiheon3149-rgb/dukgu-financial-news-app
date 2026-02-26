"use client"

import { useEffect } from "react"
import { ShieldCheck } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      // 💡 광고 로드 실행
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    // 💡 부모 컨테이너: 뉴스 카드와 동일한 너비를 위해 여백(px-0)을 제거하거나 
    // 리스트의 px-5 설정과 동일하게 맞춥니다.
    <div className="w-full my-3 px-0"> 
      <div className="group relative overflow-hidden rounded-[20px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 1. 상단 라인: 뱃지를 더 작게, 여백은 최소화하여 세로 길이를 줄임 */}
        <div className="pt-3 px-4 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-black uppercase">
            Ad
          </span>
          <span className="text-[9px] font-bold text-slate-300 tracking-tight uppercase">Sponsored</span>
        </div>

        {/* 2. 광고 본체: 세로 길이를 기사 카드보다 훨씬 짧게(120px~140px) 고정 */}
        <div className="relative z-10 p-0 overflow-hidden min-h-[120px]">
          <ins className="adsbygoogle"
               style={{ 
                 display: 'block',
                 width: '100%', 
                 height: 'auto'
               }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h"
               data-ad-client="ca-pub-4762124054224861"
               data-ad-slot="1458725046"
          ></ins>
        </div>

        {/* 3. 하단 바: 존재감만 알릴 수 있도록 극도로 슬림하게 처리 (py-1.5) */}
        <div className="px-4 py-1.5 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
          <div className="flex items-center gap-1 opacity-40">
            <ShieldCheck className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[8px] font-medium text-slate-400">덕구 선별 광고</span>
          </div>
        </div>
      </div>
    </div>
  )
}