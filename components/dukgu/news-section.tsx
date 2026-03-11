"use client"

import { useState, useRef, useEffect } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { ChevronDown, Check } from "lucide-react"
import { useNewsFeed, type DateFilter, type MarketTab } from "@/hooks/use-news-feed"

export type SortOption = "latest" | "views" | "comments"

const MARKET_TABS: { id: MarketTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kr",  label: "한국" },
  { id: "us",  label: "미국" },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "latest",   label: "최신순" },
  { id: "views",    label: "인기순" },
  { id: "comments", label: "댓글순" },
]

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy]               = useState<SortOption>("latest")
  const [dateFilter]                      = useState<DateFilter>("all")
  const [marketTab, setMarketTab]         = useState<MarketTab>("all")
  const [sortOpen, setSortOpen]           = useState(false)
  const sortRef                           = useRef<HTMLDivElement>(null)

  const { news, refresh, isLoading, isLoadingMore, hasMore, fetchNextPage } =
    useNewsFeed(sortBy, dateFilter, marketTab)

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentSort = SORT_OPTIONS.find((o) => o.id === sortBy)!

  return (
    <div className="flex flex-col gap-3">

      {/* ① 타이틀 */}
      <div className="flex items-center gap-2 px-1 mt-5 mb-3">
        <span className="relative flex h-[7px] w-[7px]">
          <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-60" />
          <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#00C48C]" />
        </span>
        <h2 className="text-[16px] font-semibold text-slate-900">실시간 뉴스</h2>
      </div>

      {/* ② 검색창 */}
      <SearchBar
        value={searchKeyword}
        onChange={setSearchKeyword}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />

      {/* ③ 마켓 필터 칩 + 정렬 드롭다운 */}
      <div className="flex items-center justify-between gap-2">

        {/* 마켓 칩 */}
        <div className="flex items-center gap-1.5">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMarketTab(tab.id)}
              className={`h-[30px] px-3 rounded-full text-[13px] font-medium transition-all active:scale-95 ${
                marketTab === tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-[#F3F4F6] text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 드롭다운 */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1 h-[30px] px-3 rounded-full bg-[#F3F4F6] text-[13px] font-medium text-gray-700 transition-all active:scale-95"
          >
            {currentSort.label}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-9 z-30 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden min-w-[96px] animate-in fade-in slide-in-from-top-1 duration-150">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSortBy(opt.id); setSortOpen(false) }}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] transition-colors ${
                    sortBy === opt.id
                      ? "text-emerald-600 font-semibold bg-emerald-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
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
