"use client"

import { useEffect } from "react"
import { ShieldCheck } from "lucide-react"

export function AdBanner() {
  useEffect(() => {
    try {
      // 💡 광고 로드
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    // 💡 1. 부모 컨테이너의 너비와 마진을 기사 카드와 똑같이 맞춥니다.
    // 만약 리스트 부모에서 이미 여백을 준다면 여기서 px-4는 제거하세요.
    <div className="w-full mb-4"> 
      <div className="group relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 2. 광고 영역: 좌우 여백을 기사 텍스트 시작점과 맞추고 싶다면 p-4~5를 조절하세요. */}
        <div className="relative z-10 overflow-hidden">
          <ins className="adsbygoogle"
               style={{ 
                 display: 'block',
                 minHeight: '200px' // 💡 로딩 전 영역 확보 (레이아웃 시프트 방지)
               }}
               data-ad-format="fluid"
               data-ad-layout-key="-hy-4+2d-1u-4h"
               data-ad-client="ca-pub-4762124054224861"
               data-ad-slot="1458725046"
          ></ins>
        </div>

        {/* 3. 하단 바: 기사 카드의 하단 여백과 느낌을 통일 */}
        <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-start bg-slate-50/20">
          <div className="flex items-center gap-1.5 opacity-60">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500 tracking-tight">
              덕구 파트너스의 안전한 광고 콘텐츠입니다
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}