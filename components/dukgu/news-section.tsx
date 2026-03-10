"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { Clock, BarChart3, RefreshCw } from "lucide-react"
import { useNewsFeed, type DateFilter, type MarketTab } from "@/hooks/use-news-feed"

export type SortOption = "latest" | "views"

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "week",  label: "주간" },
  { id: "month", label: "월간" },
  { id: "all",   label: "전체" },
]

const MARKET_TABS: { id: MarketTab; label: string; emoji?: string }[] = [
  { id: "all", label: "전체" },
  { id: "kr",  label: "한국 증시", emoji: "🇰🇷" },
  { id: "us",  label: "미국 증시", emoji: "🇺🇸" },
]

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [marketTab, setMarketTab] = useState<MarketTab>("all")

  // 💡 세 번째 인자로 marketTab을 전달하여 탭 변경 시 데이터를 새로 호출하게 함
  const { news, refresh, isLoading, isLoadingMore, hasMore, fetchNextPage } =
    useNewsFeed(sortBy, dateFilter, marketTab)

  return (
    <div className="flex flex-col gap-4">

      {/* ① 타이틀 */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <h2 className="text-[17px] font-black tracking-tight text-slate-900">실시간 뉴스</h2>
      </div>

      {/* ② 증시 탭 */}
      <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
        {MARKET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMarketTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-black transition-all active:scale-95 ${
              marketTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.emoji && <span className="text-[13px]">{tab.emoji}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ③ 검색창 + 정렬/새로고침 */}
      <div className="flex flex-col gap-3">
        <SearchBar value={searchKeyword} onChange={setSearchKeyword} />

        <div className="flex items-center justify-end gap-1.5">
          {/* 조회순 기간 필터 (조회순 선택 시만 표시) */}
          {sortBy === "views" && (
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 mr-auto animate-in slide-in-from-top-2 fade-in duration-300">
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
          )}

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

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="p-2 bg-slate-100/80 rounded-lg border border-slate-200/50 text-slate-400 hover:text-emerald-500 transition-all active:rotate-180 duration-500 disabled:opacity-30"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ④ 뉴스 카드 목록 */}
      <NewsFeed
        news={news || []}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        fetchNextPage={fetchNextPage}
        searchKeyword={searchKeyword}
        sortBy={sortBy}
        marketTab={marketTab}
      />
    </div>
  )
}