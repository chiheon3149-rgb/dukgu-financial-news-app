"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { TrendingUp, Search } from "lucide-react"
import { DetailHeader }   from "@/components/dukgu/detail-header"
import { HoldingsTab }    from "@/components/dukgu/sijang/holdings-tab"
import { WatchlistTab }   from "@/components/dukgu/sijang/watchlist-tab"
import { DiscoverTab }    from "@/components/dukgu/sijang/discover-tab"

type TabId = "holdings" | "watchlist" | "discover"

function SijangContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get("tab") as TabId) ?? "discover"

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-[80px]">

      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">증시</span>
          </div>
        }
        rightElement={
          <button
            onClick={() => router.push("/assets/search")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="종목 검색"
          >
            <Search className="w-5 h-5 text-slate-600" />
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 py-5 space-y-5">
        {tab === "holdings"  && <HoldingsTab  searchQuery="" />}
        {tab === "watchlist" && <WatchlistTab searchQuery="" />}
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
