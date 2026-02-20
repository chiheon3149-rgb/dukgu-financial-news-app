"use client"

import { useState, useEffect } from "react"
import Link from "next/link" // 라우팅을 위해 추가
import { ChevronRight } from "lucide-react"

export function HeroBanner() {
  const [market, setMarket] = useState<"KR" | "US" | null>(null)
  const [currentDateStr, setCurrentDateStr] = useState("")

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const date = now.getDate()
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const dayOfWeek = days[now.getDay()]

    setCurrentDateStr(`${year}년 ${month}월 ${date}일(${dayOfWeek}요일)`)

    const currentHour = now.getHours()
    if (currentHour >= 7 && currentHour < 16) {
      setMarket("US")
    } else {
      setMarket("KR")
    }
  }, [])

  const data = {
    KR: {
      title: "코스피 상승출발, 밸류업 훈풍",
      summary: "외국인 투자자들의 강한 매수세가 이어지며 2,680선 돌파를 시도하고 있습니다. 금융주 중심으로 강세가 뚜렷합니다.",
      tags: ["#코스피", "#밸류업", "#외인매수"],
      theme: "from-blue-500/80 to-blue-700/80 shadow-blue-500/30",
      flag: "🇰🇷",
      textColor: "text-blue-700",
      briefingType: "오후브리핑" 
    },
    US: {
      title: "나스닥 상승, 금리인하 기대감",
      summary: "미 연준(Fed)의 조기 금리 인하 기대감이 확산되며 기술주 중심으로 강한 상승 마감했습니다.",
      tags: ["#나스닥", "#금리인하", "#엔비디아"],
      theme: "from-red-400/80 to-red-600/80 shadow-red-500/30",
      flag: "🇺🇸",
      textColor: "text-red-700",
      briefingType: "오전브리핑"
    }
  }

  if (!market) return <section className="pt-2 pb-2 h-48 animate-pulse bg-muted rounded-2xl"></section>

  const currentData = data[market]

  return (
    <section className="pt-2 pb-2">
      {/* 💡 div 태그를 Link 컴포넌트로 변경하여 클릭 시 상세 페이지로 이동하도록 설정 */}
      <Link 
        href="/briefing" 
        className={`block relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentData.theme} backdrop-blur-md border border-white/20 p-5 text-white shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
      >
        
        {/* 투명 국기 배경 */}
        <div className="absolute -bottom-6 -right-4 text-[130px] opacity-[0.15] pointer-events-none select-none transition-all duration-500 transform rotate-12">
          {currentData.flag}
        </div>
        
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 drop-shadow-sm truncate mr-2">
              {currentDateStr} 오늘의 {currentData.briefingType}
            </span>
            
            <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full p-0.5 shadow-inner shrink-0">
              <button 
                onClick={(e) => {
                  e.preventDefault() // Link 이동을 막고 상태만 변경
                  setMarket("KR")
                }}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${market === "KR" ? "bg-white text-blue-700 shadow-md" : "text-white/70 hover:text-white"}`}
              >
                한국
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault() // Link 이동을 막고 상태만 변경
                  setMarket("US")
                }}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${market === "US" ? "bg-white text-red-700 shadow-md" : "text-white/70 hover:text-white"}`}
              >
                미국
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-left leading-tight truncate drop-shadow-md mb-1.5">
              {currentData.title}
            </h2>
            <p className="text-xs text-white/85 leading-relaxed line-clamp-2 drop-shadow-sm font-medium">
              {currentData.summary}
            </p>
          </div>

          <div className="flex items-end justify-between mt-1">
            <div className="flex gap-1.5 flex-wrap">
              {currentData.tags.map(tag => (
                <span key={tag} className="text-[10px] sm:text-xs px-2 py-1 bg-black/15 backdrop-blur-sm border border-white/10 rounded-md font-semibold text-white/90">
                  {tag}
                </span>
              ))}
            </div>

            {/* 💡 버튼 영역은 Link 내부이므로 클릭 이벤트 전파를 막을 필요는 없으나, 시각적 일관성을 유지 */}
            <div className={`flex items-center gap-1 text-xs font-bold bg-white ${currentData.textColor} px-3.5 py-2 rounded-lg group-hover:bg-gray-100 transition-colors shadow-lg shrink-0`}>
              <span>읽기</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </Link>
    </section>
  )
}