"use client"

import { useEffect, useRef } from "react"
import { ShieldCheck } from "lucide-react"

// 💡 [수정] 외부에서 광고 슬롯 번호와 형태를 전달받을 수 있게 구멍(Props)을 뚫어줍니다.
interface AdBannerProps {
  adSlot?: string;       // 구글 애드센스에서 발급받은 슬롯 ID
  adFormat?: string;     // 광고 형태 (fluid, auto, rectangle 등)
  layoutKey?: string;    // 인피드 광고 등에 쓰이는 레이아웃 키
  className?: string;    // 바깥 여백 등을 조정하고 싶을 때 사용
}

/**
 * 💡 AdBanner 컴포넌트 (만능 액자 버전)
 * - 구글 애드센스 중복 호출(TagError) 방지 로직 포함
 * - 어디서든 <AdBanner adSlot="새번호" /> 처럼 갈아끼워 재사용 가능
 */
export function AdBanner({
  adSlot = "1458725046",          // 값을 안 넣으면 기본값(기존 하단 광고)으로 동작
  adFormat = "fluid",             // 기본 형태
  layoutKey = "-hy-4+2d-1u-4h",   // 기본 레이아웃 키
  className = "w-full my-3 px-0"  // 기본 여백
}: AdBannerProps) {
  
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adRef.current) return;
    if (adRef.current.getAttribute("data-adsbygoogle-status") === "done") return;

    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (e) {
      console.warn("애드센스 중복 호출이 덕구에 의해 방지되었습니다냥. 🐾");
    }
  }, []);

  return (
    <div className={className}> 
      <div className="group relative overflow-hidden rounded-[20px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
        
        {/* 상단: 광고 레이블 */}
        <div className="pt-3 px-4 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-black uppercase">
            Ad
          </span>
          <span className="text-[9px] font-bold text-slate-300 tracking-tight uppercase">Sponsored</span>
        </div>

        {/* 광고 본체: 애드센스가 실제 광고를 그리는 영역 */}
        <div className="relative z-10 p-0 overflow-hidden min-h-[120px]">
          <ins 
            ref={adRef} 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: 'auto' }}
            data-ad-client="ca-pub-4762124054224861" // 💡 과장님 고유 ID는 고정!
            data-ad-slot={adSlot}                    // 💡 외부에서 받은 슬롯 번호
            data-ad-format={adFormat}                // 💡 외부에서 받은 포맷
            {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})} // 레이아웃 키가 있을 때만 적용
          ></ins>
        </div>

        {/* 하단 바: 신뢰감을 주는 푸터 */}
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