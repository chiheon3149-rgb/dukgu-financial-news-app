"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { Clock, BarChart3, RefreshCw } from "lucide-react"
import { useNewsFeed, type DateFilter } from "@/hooks/use-news-feed" 

export type SortOption = "latest" | "views"

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "week",  label: "주간" },
  { id: "month", label: "월간" },
  { id: "all",   label: "전체" },
]

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  
  // 💡 [핵심 추가] 기간 필터 상태! 기본값은 전체(all)로 해서 빈 화면을 방지합니다.
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  
  // 💡 훅에 sortBy와 dateFilter 두 개를 모두 넘겨줍니다!
  const { 
    news, 
    refresh, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    fetchNextPage 
  } = useNewsFeed(sortBy, dateFilter)

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <SearchBar value={searchKeyword} onChange={setSearchKeyword} />
      
      <div className="px-1">
        <div className="flex items-end justify-between pb-1">
          <div className="flex items-center gap-1.5 pb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              실시간 뉴스
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={() => setSortBy("latest")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all active:scale-95 ${
                  sortBy === "latest" ? "bg-white text-emerald-600 shadow-sm font-bold" : "text-slate-400 font-medium"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] tabular-nums">최신순</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy("views")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all active:scale-95 ${
                  sortBy === "views" ? "bg-white text-emerald-600 shadow-sm font-bold" : "text-slate-400 font-medium"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[11px] tabular-nums">조회순</span>
              </button>
            </div>

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

        {/* 💡 [핵심 추가] 조회순을 눌렀을 때만 나타나는 기간 필터 UI */}
        {sortBy === "views" && (
          <div className="flex justify-end pt-2 pb-1 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
              {DATE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                    dateFilter === filter.id
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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