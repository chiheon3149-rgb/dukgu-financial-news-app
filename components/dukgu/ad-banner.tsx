"use client"

import { useEffect } from "react"
import { ShieldCheck } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    // 💡 기사 리스트와의 간격을 위해 위아래 마진(my-6)을 넉넉히 줍니다.
    <div className="w-full my-6 px-4">
      <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 1. 상단 마진 및 노란색 뱃지 영역: 기사의 IT/금융 뱃지 디자인 상속 */}
        <div className="pt-5 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
              Ad
            </span>
            <span className="text-[11px] font-bold text-slate-400">Sponsored</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-200" />
        </div>

        {/* 2. 광고 본체 영역: 패딩을 적절히 주어 뱃지와 본문 사이 간격 확보 */}
        <div className="relative z-10 p-2 overflow-hidden min-h-[180px]">
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h"
               data-ad-client="ca-pub-4762124054224861"
               data-ad-slot="1458725046"
          ></ins>
        </div>

        {/* 3. 하단 안내 바: 더 연하고 깔끔하게 처리 */}
        <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/10">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            덕구는 유용한 정보 공유를 위해 파트너사의 콘텐츠를 선별하여 제공합니다.
          </p>
        </div>

        {/* 배경 장식: 덕구만의 은은한 노란색 빛 효과 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/40 blur-3xl -z-10" />
      </div>
    </div>
  )
}