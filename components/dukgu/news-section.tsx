"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { Clock, BarChart3 } from "lucide-react"
import { useNewsFeed, type DateFilter, type MarketTab } from "@/hooks/use-news-feed"

export type SortOption = "latest" | "views"

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "week",  label: "이번주" },
  { id: "month", label: "이번달" },
  { id: "all",   label: "전체" },
]

const MARKET_TABS: { id: MarketTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kr",  label: "한국" },
  { id: "us",  label: "미국" },
]

const SORT_TABS: { id: SortOption; label: string; icon: React.ReactNode }[] = [
  { id: "latest", label: "최신순", icon: <Clock className="w-3 h-3" /> },
  { id: "views",  label: "인기순", icon: <BarChart3 className="w-3 h-3" /> },
]

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [marketTab, setMarketTab] = useState<MarketTab>("all")

  const { news, refresh, isLoading, isLoadingMore, hasMore, fetchNextPage } =
    useNewsFeed(sortBy, dateFilter, marketTab)

  return (
    <div className="flex flex-col gap-3">

      {/* ① 타이틀 */}
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-[7px] w-[7px]">
          <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-60" />
          <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#00C48C]" />
        </span>
        <h2 className="text-[17px] font-extrabold tracking-[-0.4px] text-[#111111]">실시간 뉴스</h2>
      </div>

      {/* ② 증시 탭 — 풀 그리드 3등분 */}
      <div className="w-full grid grid-cols-3 gap-2">
        {MARKET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMarketTab(tab.id)}
            className={`flex items-center justify-center h-[34px] rounded-full text-[12px] transition-all active:scale-95 ${
              marketTab === tab.id
                ? "bg-[#00C48C] text-white font-bold"
                : "bg-slate-100 text-slate-500 font-medium border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ③ 검색창 (새로고침 버튼 내장) */}
      <SearchBar
        value={searchKeyword}
        onChange={setSearchKeyword}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />

      {/* ④ 정렬 필터 — 풀 그리드 2등분 */}
      <div className="flex flex-col gap-2 w-full">
        <div className="w-full grid grid-cols-2 gap-2">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSortBy(tab.id)}
              className={`flex items-center justify-center gap-1.5 h-[34px] rounded-full text-[12px] transition-all active:scale-95 ${
                sortBy === tab.id
                  ? "bg-[#00C48C] text-white font-bold"
                  : "bg-slate-100 text-slate-500 font-medium border border-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 기간 필터 — 인기순일 때만 표시, 풀 그리드 4등분 */}
        {sortBy === "views" && (
          <div className="w-full grid grid-cols-4 gap-2">
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDateFilter(filter.id)}
                className={`flex items-center justify-center h-[34px] rounded-full text-[12px] transition-all active:scale-95 ${
                  dateFilter === filter.id
                    ? "bg-[#00C48C] text-white font-bold"
                    : "bg-slate-100 text-slate-500 font-medium border border-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ⑤ 뉴스 카드 목록 */}
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
