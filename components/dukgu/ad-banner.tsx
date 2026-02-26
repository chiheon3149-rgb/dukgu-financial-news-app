"use client"

import { useEffect, useRef } from "react"
import { ShieldCheck } from "lucide-react"

/**
 * 💡 AdBanner 컴포넌트
 * - 구글 애드센스 중복 호출(TagError) 방지 로직 포함
 * - 뉴스 카드와 조화로운 UI 디자인
 */
export function AdBanner() {
  // 1. 광고 요소가 이미 처리되었는지 감시하기 위한 Ref
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // 💡 [에러 해결 핵심 검문소]
    // 요소가 없거나, 이미 애드센스가 점유(status="done")했다면 더 이상 진행하지 않음
    if (!adRef.current) return;
    if (adRef.current.getAttribute("data-adsbygoogle-status") === "done") return;

    try {
      // 윈도우 객체에서 adsbygoogle 배열을 찾아 광고 푸시 명령 전달
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (e) {
      // 이미 로드된 광고에 대한 사소한 경고는 무시하여 콘솔을 깨끗하게 유지
      console.warn("애드센스 중복 호출이 덕구에 의해 방지되었습니다냥. 🐾");
    }
  }, []);

  return (
    <div className="w-full my-3 px-0"> 
      <div className="group relative overflow-hidden rounded-[20px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 1. 상단: 광고 레이블 (디자인 가이드 준수) */}
        <div className="pt-3 px-4 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-black uppercase">
            Ad
          </span>
          <span className="text-[9px] font-bold text-slate-300 tracking-tight uppercase">Sponsored</span>
        </div>

        {/* 2. 광고 본체: 애드센스가 실제 광고를 그리는 영역 */}
        <div className="relative z-10 p-0 overflow-hidden min-h-[120px]">
          <ins 
            ref={adRef} 
            className="adsbygoogle"
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

        {/* 3. 하단 바: 신뢰감을 주는 푸터 */}
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