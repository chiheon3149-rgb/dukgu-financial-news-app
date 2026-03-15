"use client"

import { useState, useRef, useEffect } from "react"
import { SearchBar } from "./search-bar"
import { NewsFeed } from "./news-feed"
import { CategoryChips } from "./category-chips"
import { ChevronDown, Check } from "lucide-react"
import { useNewsFeed, type DateFilter, type MarketTab } from "@/hooks/use-news-feed"

export type SortOption = "latest" | "views" | "comments"

const MARKET_TABS: { id: MarketTab; label: string }[] = [
  { id: "all",      label: "전체" },
  { id: "kr",       label: "한국" },
  { id: "us",       label: "미국" },
  { id: "breaking", label: "속보" },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "latest",   label: "최신순" },
  { id: "views",    label: "인기순" },
  { id: "comments", label: "댓글순" },
]

const DATE_FILTER_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "week",  label: "이번주" },
  { id: "month", label: "이번달" },
  { id: "all",   label: "전체" },
]

export function NewsSection() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortBy, setSortBy]               = useState<SortOption>("latest")
  const [dateFilter, setDateFilter]       = useState<DateFilter>("today")
  const [marketTab, setMarketTab]         = useState<MarketTab>("all")
  const [sortOpen, setSortOpen]           = useState(false)
  const [dateOpen, setDateOpen]           = useState(false)
  const sortRef                           = useRef<HTMLDivElement>(null)
  const dateRef                           = useRef<HTMLDivElement>(null)

  const { news, refresh, isLoading, isLoadingMore, hasMore, fetchNextPage } =
    useNewsFeed(sortBy, dateFilter, marketTab)

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 인기순 해제 시 날짜 필터 초기화
  useEffect(() => {
    if (sortBy !== "views") setDateFilter("today")
  }, [sortBy])

  const currentSort       = SORT_OPTIONS.find((o) => o.id === sortBy)!
  const currentDateFilter = DATE_FILTER_OPTIONS.find((o) => o.id === dateFilter)!

  return (
    <div className="flex flex-col gap-3">

      {/* ① 타이틀 */}
      <div className="px-1 mt-2 mb-2">
        <h2 className="text-[18px] font-bold text-[#111827]">🔥 지금 올라온 뉴스</h2>
      </div>

      {/* ② 검색창 */}
      <SearchBar
        value={searchKeyword}
        onChange={setSearchKeyword}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />

      {/* ③ 필터 칩 + 정렬 드롭다운 */}
      <div className="flex items-center justify-between gap-2">

        {/* 칩 필터 */}
        <CategoryChips
          chips={MARKET_TABS}
          active={marketTab}
          onChange={setMarketTab}
        />

        {/* 우측 고정: 날짜 필터 (인기순 시만) + 정렬 드롭다운 */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* 날짜 필터 드롭다운 (인기순 선택 시만 노출) */}
          {sortBy === "views" && (
            <div className="relative" ref={dateRef}>
              <button
                type="button"
                onClick={() => setDateOpen((v) => !v)}
                className="flex items-center gap-1 py-[6px] px-[14px] rounded-[999px] bg-[#F1F5F9] text-[13px] font-medium text-gray-700 active:scale-95"
                style={{ transition: "background 0.2s" }}
              >
                {currentDateFilter.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dateOpen ? "rotate-180" : ""}`} />
              </button>

              {dateOpen && (
                <div className="absolute right-0 top-9 z-30 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden min-w-[88px] animate-in fade-in slide-in-from-top-1 duration-150">
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setDateFilter(opt.id); setDateOpen(false) }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] transition-colors ${
                        dateFilter === opt.id
                          ? "text-emerald-600 font-semibold bg-emerald-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                      {dateFilter === opt.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 정렬 드롭다운 */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1 py-[6px] px-[14px] rounded-[999px] bg-[#F1F5F9] text-[13px] font-medium text-gray-700 active:scale-95"
              style={{ transition: "background 0.2s" }}
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
