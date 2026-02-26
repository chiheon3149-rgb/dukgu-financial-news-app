"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { Clock, BarChart3, RefreshCw } from "lucide-react"
import { useNewsFeed } from "@/hooks/use-news-feed"

// 💡 정렬 옵션 타입 정의
export type SortOption = "latest" | "views"

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  
  // 💡 훅에서 필요한 모든 데이터와 함수를 구조 분해 할당으로 가져옵니다.
  // 훅 내부에서 news, isLoadingMore, hasMore, fetchNextPage가 모두 반환되어야 합니다.
  const { 
    news, 
    refresh, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    fetchNextPage 
  } = useNewsFeed(sortBy)

  return (
    /* gap-5를 gap-3.5로 줄여 검색바와 헤더 사이 간격을 압축했습니다. */
    <div className="flex flex-col gap-3.5 pt-1">
      
      {/* 1. 검색 바 */}
      <SearchBar value={searchKeyword} onChange={setSearchKeyword} />
      
      {/* 2. 뉴스 헤더 영역 (타이틀 + 새로고침 + 정렬) */}
      <div className="px-1">
        <div className="flex items-end justify-between pb-1">
          {/* 좌측: 타이틀 & LIVE 표시 */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              실시간 뉴스
            </h2>
          </div>

          {/* 우측: 정렬 캡슐 & 새로고침 버튼 */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={() => setSortBy("latest")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all active:scale-95 ${
                  sortBy === "latest" 
                  ? "bg-white text-emerald-600 shadow-sm font-bold" 
                  : "text-slate-400 font-medium"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] tabular-nums">최신순</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy("views")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all active:scale-95 ${
                  sortBy === "views" 
                  ? "bg-white text-emerald-600 shadow-sm font-bold" 
                  : "text-slate-400 font-medium"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[11px] tabular-nums">조회순</span>
              </button>
            </div>

            {/* 새로고침 버튼 */}
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="p-2 bg-slate-100/80 rounded-lg border border-slate-200/50 text-slate-400 hover:text-emerald-500 transition-all active:rotate-180 duration-500 disabled:opacity-30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. 뉴스 리스트: 💡 무한 스크롤에 필요한 모든 props를 NewsFeed 전문 규격에 맞춰 넘깁니다. */}
      <NewsFeed 
        news={news || []} 
        isLoading={isLoading} 
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        fetchNextPage={fetchNextPage}
        searchKeyword={searchKeyword} 
        sortBy={sortBy} 
      />
    </div>
  )
}