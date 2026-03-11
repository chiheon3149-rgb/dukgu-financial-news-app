"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { FilterTabs } from "./filter-tabs"
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

      {/* ② 증시 탭 */}
      <FilterTabs
        tabs={MARKET_TABS}
        value={marketTab}
        onChange={(id) => setMarketTab(id as MarketTab)}
      />

      {/* ③ 검색창 (새로고침 버튼 내장) */}
      <SearchBar
        value={searchKeyword}
        onChange={setSearchKeyword}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />

      {/* ④ 정렬 필터 */}
      <div className="flex flex-col gap-2 w-full">
        <FilterTabs
          tabs={SORT_TABS}
          value={sortBy}
          onChange={(id) => setSortBy(id as SortOption)}
        />

        {/* 기간 필터 — 인기순일 때만 표시 */}
        {sortBy === "views" && (
          <FilterTabs
            tabs={DATE_FILTERS}
            value={dateFilter}
            onChange={(id) => setDateFilter(id as DateFilter)}
          />
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
