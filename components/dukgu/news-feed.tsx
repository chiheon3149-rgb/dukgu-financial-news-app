"use client"

import { useState, useEffect, useRef } from "react"
// 💡 이동 수단인 Link를 불러옵니다!
import Link from "next/link" 
import { NewsCard } from "./news-card"
import { Clock, RefreshCw, Loader2 } from "lucide-react"

const initialNewsData = [
  { category: "경제" as const, tags: ["#금리동결", "#한국은행"], headline: "한국은행, 기준금리 3.0% 동결… ‘추가 인하 여지’", summary: "향후 경기 흐름을 지켜보며 통화 정책을 유연하게 가져가겠다고 밝혔다.", timeAgo: "10분 전", goodCount: 128, badCount: 15, commentCount: 34 },
  { category: "경제" as const, tags: ["#미연준", "#나스닥"], headline: "미 연준 의사록 공개… 올해 하반기 금리 인하 시그널", summary: "연방준비제도의 금리 인하 가능성 시사에 글로벌 증시가 일제히 반등했다.", timeAgo: "25분 전", goodCount: 256, badCount: 22, commentCount: 67 },
  { category: "경제" as const, tags: ["#삼성전자", "#HBM"], headline: "삼성전자, HBM AI 반도체 수주 2조원 돌파", summary: "글로벌 AI 빅테크 기업들로부터 차세대 메모리 반도체 대규모 수주에 성공했다.", timeAgo: "1시간 전", goodCount: 512, badCount: 8, commentCount: 89 },
  { category: "정치" as const, tags: ["#추경예산", "#민생안정"], headline: "정부, 민생 안정 위한 하반기 추경 편성 공식 검토", summary: "경기 둔화 방어 및 소상공인 지원을 위해 추가경정예산 편성에 착수했다.", timeAgo: "1시간 전", goodCount: 87, badCount: 45, commentCount: 123 },
  { category: "사회" as const, tags: ["#부동산", "#강남3구"], headline: "서울 아파트 매매가, 강남 3구 중심으로 3주 연속 상승", summary: "거래량이 전월 대비 20% 증가하며 바닥을 다졌다는 분석이 나오고 있다.", timeAgo: "2시간 전", goodCount: 64, badCount: 98, commentCount: 201 },
  { category: "문화" as const, tags: ["#MZ세대", "#재테크"], headline: "MZ세대 ‘커피값으로 주식 산다’… 소액 투자 열풍", summary: "월 5만 원 미만의 소액으로 우량주를 모아가는 2030 투자자가 급증했다.", timeAgo: "2시간 전", goodCount: 342, badCount: 12, commentCount: 156 },
  { category: "경제" as const, tags: ["#오픈AI", "#인공지능"], headline: "오픈AI, 새로운 추론 모델 '오리온' 다음 달 깜짝 공개", summary: "인간의 논리적 사고를 모방한 차세대 AI 모델 출시가 임박했다는 소식이다.", timeAgo: "3시간 전", goodCount: 890, badCount: 5, commentCount: 412 },
  { category: "경제" as const, tags: ["#코스피", "#외국인순매수"], headline: "코스피, 외국인 '바이 코리아'에 2,700선 안착 시도", summary: "반도체와 자동차 대형주를 중심으로 외국인 순매수가 5거래일째 이어졌다.", timeAgo: "3시간 전", goodCount: 156, badCount: 42, commentCount: 88 },
  { category: "경제" as const, tags: ["#환율", "#무역수지"], headline: "원·달러 환율, 수출 호조에 1,320원대 하향 안정세", summary: "무역수지 흑자 폭이 커지면서 환율 변동성이 눈에 띄게 줄어들고 있다.", timeAgo: "4시간 전", goodCount: 92, badCount: 11, commentCount: 45 },
  { category: "경제" as const, tags: ["#현대차", "#IPO"], headline: "현대차, 인도법인 IPO 흥행 성공… 글로벌 공략 가속", summary: "인도 증시 상장을 통해 확보한 자금으로 현지 전기차 공장을 증설한다.", timeAgo: "4시간 전", goodCount: 421, badCount: 33, commentCount: 189 },
]

export function NewsFeed() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [displayNews, setDisplayNews] = useState(initialNewsData)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true)
    setTimeout(() => {
      setDisplayNews(initialNewsData)
      setIsRefreshing(false)
    }, 1000)
  }

  const loadMoreNews = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const categories = ["정치", "경제", "사회", "문화"] as const;
      
      const moreNews = Array.from({ length: 10 }).map((_, i) => ({
        category: categories[Math.floor(Math.random() * categories.length)],
        tags: ["#속보", "#단독"],
        headline: `[속보] DUKGU 실시간 업데이트 뉴스 ${displayNews.length + i + 1}보`,
        summary: "방금 전 백엔드(서버)에서 새롭게 도착한 따끈따끈한 뉴스입니다. 데이터가 끊임없이 이어집니다.",
        timeAgo: `${displayNews.length + i + 1}시간 전`,
        goodCount: Math.floor(Math.random() * 500),
        badCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 200),
      }));

      setDisplayNews(prev => [...prev, ...moreNews]);
      setIsLoadingMore(false);
    }, 1500);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreNews()
        }
      },
      { threshold: 1.0 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [isLoadingMore])

  return (
    <section className="px-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5 mt-4 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-800" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            실시간 뉴스
          </h2>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors active:opacity-70 disabled:opacity-50"
        >
          <span>업데이트</span>
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {displayNews.map((news, index) => (
          /* 💡 핵심 수정: 각 NewsCard를 Link로 감싸서 해당 id(여기서는 index) 주소로 보내줍니다! */
          <Link key={index} href={`/news/${index + 1}`} className="block">
            <NewsCard {...news} />
          </Link>
        ))}
      </div>

      <div ref={observerTarget} className="w-full py-8 flex justify-center items-center">
        {isLoadingMore ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-medium">이전 10개 뉴스 불러오는 중...</span>
          </div>
        ) : (
          <div className="h-10 opacity-0">센서 대기 중</div> 
        )}
      </div>
    </section>
  )
}