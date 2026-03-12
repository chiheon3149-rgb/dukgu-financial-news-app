"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import { DetailHeader }   from "@/components/dukgu/detail-header"
import { CategoryChips }  from "@/components/dukgu/category-chips"
import { StockSearchBar } from "@/components/dukgu/sijang/stock-search-bar"
import { HoldingsTab }    from "@/components/dukgu/sijang/holdings-tab"
import { WatchlistTab }   from "@/components/dukgu/sijang/watchlist-tab"
import { DiscoverTab }    from "@/components/dukgu/sijang/discover-tab"

type TabId = "holdings" | "watchlist" | "discover"

const TABS: { id: TabId; label: string }[] = [
  { id: "holdings",  label: "보유" },
  { id: "watchlist", label: "관심" },
  { id: "discover",  label: "발견" },
]

export default function SijangPage() {
  const [activeTab,   setActiveTab]   = useState<TabId>("discover")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">

      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">증시</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-5 space-y-5">

        {/* 검색창 — 자동완성 드롭다운 포함 (종목명 클릭 시 상세 페이지로 이동) */}
        <StockSearchBar onQueryChange={setSearchQuery} />

        {/* 탭 */}
        <CategoryChips
          chips={TABS}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* 탭 컨텐츠 */}
        {activeTab === "holdings"  && <HoldingsTab  searchQuery={searchQuery} />}
        {activeTab === "watchlist" && <WatchlistTab searchQuery={searchQuery} />}
        {activeTab === "discover"  && <DiscoverTab />}

      </main>
    </div>
  )
}
