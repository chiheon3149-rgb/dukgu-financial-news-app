"use client"

import { useEffect } from "react"
import { ShieldCheck } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      // 💡 구글 광고 엔진 호출
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="w-full px-4 mb-6">
      {/* 💡 버튼을 없애고 광고가 카드 전체를 채우도록 설정 */}
      <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 1. 광고 영역: 구글이 쏴주는 디자인이 그대로 노출됩니다. */}
        <div className="relative z-10 p-0 overflow-hidden">
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h"
               data-ad-client="ca-pub-4762124054224861"
               data-ad-slot="1458725046"
          ></ins>
        </div>

        {/* 2. 슬림 하단 바: 버튼 대신 '신뢰'를 주는 문구만 작게 배치 */}
        <div className="px-5 py-2.5 border-t border-slate-50 flex items-center justify-start bg-slate-50/20">
          <div className="flex items-center gap-1.5 opacity-60">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500 tracking-tight">
              덕구 파트너스의 안전한 광고 콘텐츠입니다
            </span>
          </div>
        </div>

        {/* 배경 장식 포인트 (은은하게) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/20 blur-3xl -z-10" />
      </div>
    </div>
  )
}