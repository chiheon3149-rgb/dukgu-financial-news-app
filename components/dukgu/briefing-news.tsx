"use client"

import { useState } from "react"
import { Newspaper, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"

// 💡 1. 'mode' 데이터를 받을 수 있게 입구(Interface)를 정의합니다.
interface NewsItem {
  stars: number
  cat: string
  color: "blue" | "emerald" | "slate"
  title: string
  summary?: string
  insight?: string
  link: string
}

interface BriefingNewsProps {
  mode: "US" | "KR"
  items?: NewsItem[]
}

function starsStr(n: number): string {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n))
}

const usNewsData: NewsItem[] = [
  { stars: 5, cat: "Eco",  color: "slate",   title: "미 대법원 관세 판결 오늘 밤 발표 대기", summary: "트럼프 전 대통령의 상호관세 권한 위헌 여부 결정. 결과에 따라 글로벌 무역망 구조가 전면 재설계됨.", link: "#" },
  { stars: 5, cat: "Tech", color: "blue",    title: "메타, 엔비디아 차세대 칩 '베라 루빈' 대거 채택", insight: "B2B 솔루션 기획 시 '표준화된 1등 인프라'를 쓰는 것이 장기적으로 유리함을 시사.", link: "#" },
  { stars: 4, cat: "Bio",  color: "emerald", title: "FDA, 차세대 비만 치료제 패스트트랙 승인", insight: "헬스케어 플랫폼 기획 시 사용자의 '투약 관리 주기' 알림 로직 변경 필요.", link: "#" },
  { stars: 4, cat: "Tech", color: "blue",    title: "오픈AI, 추론 전용 초경량 로컬 모델 공개", insight: "향후 앱 기획 시 서버 통신 없이 디바이스 내에서 처리하는 온디바이스 AI 기능 설계 필수.", link: "#" },
]

const krNewsData: NewsItem[] = [
  { stars: 5, cat: "Tech",   color: "blue",    title: "네이버, 한국형 초거대 AI '하이퍼클로바X' 패치 배포", summary: "국내 비즈니스 환경에 최적화된 API 성능 개선. 로컬라이징 서비스 기획자들에게 강력한 도구 제공.", insight: "국내 특화 데이터셋을 활용한 챗봇 UI 기획 시 우선순위 고려 대상.", link: "#" },
  { stars: 4, cat: "Eco",    color: "slate",   title: "금감원, 가계부채 관리 위한 'DSR 3단계' 조기 도입 검토", summary: "대출 한도 데이터 축소 예상. 핀테크/프롭테크 앱 내 한도 조회 로직의 대대적인 수정 불가피.", link: "#" },
  { stars: 4, cat: "Policy", color: "emerald", title: "K-배터리, 차세대 전고체 배터리 양산 라인 가동", insight: "에너지 섹터 인프라 업데이트. 관련 투자 모니터링 대시보드 기획 시 주요 지표로 설정 필요.", link: "#" },
  { stars: 3, cat: "Tech",   color: "blue",    title: "카카오, 테이블오더 시장 점유율 확대 선언", summary: "페이젠(PayZen) 등 기존 시장 플레이어와의 트래픽 경쟁 심화 예상.", insight: "브랜드 차별화 및 오프라인 SDK 안정성이 승부처가 될 것.", link: "#" },
]

export function BriefingNews({ mode, items }: BriefingNewsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentData: NewsItem[] = items
    ?? (mode === "US" ? usNewsData : krNewsData)
  const visibleNews = isExpanded ? currentData : currentData.slice(0, 3)

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <Newspaper className="w-5 h-5 text-teal-500" /> 
          {mode === "US" ? "Global Eco & Tech" : "Domestic IT & Market"}
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
          Total {currentData.length}
        </span>
      </div>
      
      <div className="space-y-4">
        {visibleNews.map((news, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all">
            <div className="flex justify-between items-start mb-2.5">
              <div className="flex gap-1 text-amber-400 text-[10px] items-center">
                {starsStr(news.stars)}
                {news.cat && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-md font-bold text-[9px] uppercase 
                    ${news.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                      news.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 
                      'bg-slate-200 text-slate-600'}`}>
                    {news.cat}
                  </span>
                )}
              </div>
              <a href={news.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                원문 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            
            <h4 className="font-bold text-sm text-slate-800 leading-snug mb-2">{news.title}</h4>
            {news.summary && <p className="text-[11px] text-slate-500 leading-relaxed">{news.summary}</p>}
            {news.insight && (
              <div className={`mt-3 p-3 rounded-lg border shadow-sm bg-white ${news.color === 'blue' ? 'border-blue-100' : 'border-emerald-100'}`}>
                <span className={`text-[10px] font-black mb-1.5 block flex items-center gap-1 ${news.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  <CheckCircle2 className="w-3 h-3" /> Planner's Insight
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">{news.insight}</p>
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 bg-white text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
        >
          {isExpanded ? (
            <>접기 <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>더보기 ({currentData.length - 3}건) <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </section>
  )
}