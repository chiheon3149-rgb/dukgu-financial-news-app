"use client"

// =============================================================================
// 📈 증시 메인 페이지
//
// 1단계: 상단 검색창 + 헤더 레이아웃
// 2단계: [보유 / 관심 / 발견] 3개 탭 전환 구조
// 3단계: 각 탭 내용 (HoldingsTab, WatchlistTab, DiscoverTab)
// =============================================================================

import { useState } from "react"
import { TrendingUp, Search, X } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { HoldingsTab }  from "@/components/dukgu/sijang/holdings-tab"
import { WatchlistTab } from "@/components/dukgu/sijang/watchlist-tab"
import { DiscoverTab }  from "@/components/dukgu/sijang/discover-tab"

// 탭 타입: 보유 / 관심 / 발견
type TabId = "holdings" | "watchlist" | "discover"

// 💡 3개의 탭 정의 — 마치 책의 목차 같은 역할이에요
const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "holdings",  label: "보유",  emoji: "💼" },
  { id: "watchlist", label: "관심",  emoji: "❤️" },
  { id: "discover",  label: "발견",  emoji: "🌍" },
]

export default function SijangPage() {
  // 현재 선택된 탭 (기본: 발견)
  const [activeTab,   setActiveTab]   = useState<TabId>("discover")
  // 검색창 입력값
  const [searchQuery, setSearchQuery] = useState("")
  // 검색창 포커스 여부
  const [searchFocus, setSearchFocus] = useState(false)

  return (
    <div className="min-h-dvh bg-[#F4F6F9] pb-24">

      {/* ── 상단 헤더 ─────────────────────────────────────────────────── */}
      {/* 💡 이 헤더는 앱 최상단에 고정되는 '간판' 같은 역할이에요 */}
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900">증시</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-4 pt-4 pb-8 space-y-4">

        {/* ── 1단계: 검색창 ─────────────────────────────────────────────── */}
        {/* 💡 이 검색창은 종목명이나 티커(주식 코드)로 검색할 수 있어요 */}
        <div className={`flex items-center gap-2.5 bg-white rounded-[18px] px-4 py-3 shadow-sm border transition-all duration-200 ${
          searchFocus ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-slate-100"
        }`}>
          <Search className={`w-4 h-4 shrink-0 transition-colors ${searchFocus ? "text-emerald-500" : "text-slate-300"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
            className="flex-1 text-[14px] font-bold text-slate-800 placeholder:text-slate-300 bg-transparent outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* ── 2단계: 탭 네비게이션 ─────────────────────────────────────── */}
        {/* 💡 세 개의 탭은 '방' 같은 역할이에요 — 클릭하면 그 방으로 이동해요! */}
        <div className="bg-slate-100 rounded-[20px] p-1 flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[16px] text-[13px] font-black transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="text-[14px]">{tab.emoji}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── 3단계: 탭 내용 렌더링 ────────────────────────────────────── */}
        {/* 💡 탭에 따라 다른 방의 내용을 보여줘요 (현관 선택에 따라 다른 방) */}
        {activeTab === "holdings"  && <HoldingsTab  searchQuery={searchQuery} />}
        {activeTab === "watchlist" && <WatchlistTab searchQuery={searchQuery} />}
        {activeTab === "discover"  && <DiscoverTab />}

      </main>
    </div>
  )
}
