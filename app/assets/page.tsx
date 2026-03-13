"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { TrendingUp } from "lucide-react"
import { DetailHeader }   from "@/components/dukgu/detail-header"
import { StockSearchBar } from "@/components/dukgu/sijang/stock-search-bar"
import { HoldingsTab }    from "@/components/dukgu/sijang/holdings-tab"
import { WatchlistTab }   from "@/components/dukgu/sijang/watchlist-tab"
import { DiscoverTab }    from "@/components/dukgu/sijang/discover-tab"
import { useState }       from "react"

type TabId = "holdings" | "watchlist" | "discover"

function SijangContent() {
  const searchParams = useSearchParams()
  const tab = (searchParams.get("tab") as TabId) ?? "discover"
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-[120px]">

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
        <StockSearchBar onQueryChange={setSearchQuery} />

        {tab === "holdings"  && <HoldingsTab  searchQuery={searchQuery} />}
        {tab === "watchlist" && <WatchlistTab searchQuery={searchQuery} />}
        {tab === "discover"  && <DiscoverTab />}
      </main>
    </div>
  )
}

export default function SijangPage() {
  return (
    <Suspense>
      <SijangContent />
    </Suspense>
  )
}
