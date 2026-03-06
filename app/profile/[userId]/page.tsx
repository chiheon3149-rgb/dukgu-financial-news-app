"use client"

import { useState, useEffect, useMemo, use } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Lock, TrendingUp, UserPlus, UserMinus,
  Landmark, Bitcoin, Banknote, Building2, ScrollText, Package, PieChart as PieIcon, ChevronDown
} from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useFollow } from "@/hooks/use-follow"
import { useUser } from "@/context/user-context"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { useMarketPrice } from "@/hooks/use-market-price"
import { getLevelMeta } from "@/lib/mock/user"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 👤 /profile/[userId] — 상대방 공개 프로필
// 팔로우 중이고, 상대가 portfolioPublic: true일 때만 포트폴리오 표시
// =============================================================================

const AssetPieChart = dynamic(
  () => import("recharts").then((re) => {
    const { PieChart, Pie, Cell } = re
    return function Chart({ data }: { data: any[] }) {
      return (
        <PieChart width={150} height={150}>
          <Pie data={data} cx={75} cy={75} innerRadius={50} outerRadius={68}
            paddingAngle={4} dataKey="value" stroke="none" cornerRadius={5} isAnimationActive={false}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Pie>
        </PieChart>
      )
    }
  }),
  { ssr: false, loading: () => <div className="w-[150px] h-[150px]" /> }
)

interface ProfileRow {
  id: string
  nickname: string
  avatar_emoji: string | null
  total_xp: number | null
  joined_at: string | null
  portfolio_public: boolean | null
}

interface PortfolioData {
  stocks: number
  realestate: number
  gold: number
  cash: number
  savings: number
  savingsInterest: number
  bonds: number
  bondsCoupon: number
  etc: number
}

function calcExpectedInterest(row: any): number {
  const start = new Date(row.start_date)
  const end = new Date(row.end_date)
  const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
  if (months === 0) return 0
  if (row.type === "savings" && row.monthly_amount) {
    const monthlyRate = Number(row.annual_rate) / 100 / 12
    return Math.round(Number(row.monthly_amount) * monthlyRate * (months * (months + 1)) / 2)
  }
  return Math.round(Number(row.principal) * (Number(row.annual_rate) / 100) * (months / 12))
}

const ASSET_TYPES = [
  { key: "stocks" as const,    name: "주식",    description: "국내 / 해외",    Icon: TrendingUp, color: "emerald", chartColor: "#10b981", detailPath: null },
  { key: "realestate" as const, name: "부동산",  description: "아파트, 토지 등", Icon: Landmark,   color: "indigo",  chartColor: "#6366f1", detailPath: "/assets/realestate" },
  { key: "gold" as const,      name: "금",      description: "금 현물",        Icon: null,       color: "yellow",  chartColor: "#eab308", emoji: "🥇", detailPath: "/assets/gold" },
  { key: "cash" as const,      name: "현금",    description: "원화, 외화",      Icon: Banknote,   color: "emerald", chartColor: "#22c55e", detailPath: "/assets/cash" },
  { key: "savings" as const,   name: "예·적금", description: "정기 예금, 적금", Icon: Building2,  color: "blue",    chartColor: "#3b82f6", detailPath: "/assets/savings" },
  { key: "bonds" as const,     name: "채권",    description: "국채, 회사채",    Icon: ScrollText, color: "indigo",  chartColor: "#8b5cf6", detailPath: "/assets/bonds" },
  { key: "etc" as const,       name: "기타",    description: "미술품, 자동차",  Icon: Package,    color: "rose",    chartColor: "#f43f5e", detailPath: "/assets/etc" },
]

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500"  },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-500"  },
  blue:    { bg: "bg-blue-50",    text: "text-blue-500"    },
  rose:    { bg: "bg-rose-50",    text: "text-rose-500"    },
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { profile: myProfile } = useUser()
  const { isFollowing, toggleFollow } = useFollow()
  const usdToKrw = useExchangeRate()
  const [mounted, setMounted] = useState(false)
  const [targetProfile, setTargetProfile] = useState<ProfileRow | null | undefined>(undefined)
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [stockHoldingsList, setStockHoldingsList] = useState<{ticker: string, name: string, invested: number, totalShares: number, avgCostPrice: number, currency: "KRW" | "USD"}[]>([])
  const [stockAccordionOpen, setStockAccordionOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, nickname, avatar_emoji, total_xp, joined_at, portfolio_public")
      .eq("id", userId)
      .single()
      .then(({ data }) => setTargetProfile(data ?? null))
  }, [userId])

  const levelMeta = useMemo(
    () => getLevelMeta(targetProfile?.total_xp ?? 0),
    [targetProfile?.total_xp]
  )

  const isMyself = !!myProfile?.id && myProfile.id === userId
  const following = isFollowing(userId)
  const canView = following && !!targetProfile?.portfolio_public

  const tickers = useMemo(() => stockHoldingsList.map(h => h.ticker), [stockHoldingsList])
  const { quotes: stockQuotes } = useMarketPrice(tickers)

  useEffect(() => {
    if (!canView || !targetProfile?.id) return
    const uid = targetProfile.id
    setPortfolioLoading(true)

    const CASH_RATE: Record<string, number> = { KRW: 1, USD: usdToKrw, EUR: 1550, JPY: 9.8, CNY: 198 }

    Promise.all([
      supabase.from("asset_stock_holdings").select("id, ticker, name, currency").eq("user_id", uid),
      supabase.from("asset_stock_trades").select("holding_id, trade_type, price, quantity").eq("user_id", uid),
      supabase.from("asset_realestate").select("current_estimated_price, acquisition_price").eq("user_id", uid),
      supabase.from("asset_gold").select("price_per_gram, grams, trade_type").order("trade_date", { ascending: true }).eq("user_id", uid),
      supabase.from("asset_cash").select("currency, amount").eq("user_id", uid),
      supabase.from("asset_savings").select("type, principal, annual_rate, start_date, end_date, monthly_amount").eq("user_id", uid),
      supabase.from("asset_bonds").select("face_value, quantity, coupon_rate, purchase_price").eq("user_id", uid),
      supabase.from("asset_etc").select("purchase_price, current_price").eq("user_id", uid),
      fetch("/api/market/gold").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([stockHoldingsResult, trades, realestate, goldRows, cash, savings, bonds, etc, goldQuote]) => {
      // 주식: 매도 반영 잔여 보유량 기준 비용 계산 + 종목별 통계
      let stocks = 0
      const holdingStats: Record<string, { totalCost: number; totalShares: number }> = {}
      for (const t of trades.data ?? []) {
        const hid = t.holding_id
        if (!hid) continue
        if (!holdingStats[hid]) holdingStats[hid] = { totalCost: 0, totalShares: 0 }
        if (t.trade_type === "buy") {
          holdingStats[hid].totalCost += Number(t.price) * Number(t.quantity)
          holdingStats[hid].totalShares += Number(t.quantity)
        } else {
          const avg = holdingStats[hid].totalShares > 0 ? holdingStats[hid].totalCost / holdingStats[hid].totalShares : 0
          holdingStats[hid].totalCost -= avg * Number(t.quantity)
          holdingStats[hid].totalShares -= Number(t.quantity)
        }
      }
      for (const s of Object.values(holdingStats)) stocks += Math.max(0, s.totalCost)
      // 같은 ticker가 여러 계좌에 있을 수 있으므로 ticker 기준으로 합산
      const byTicker: Record<string, { name: string; currency: "KRW" | "USD"; totalCost: number; totalShares: number }> = {}
      for (const h of stockHoldingsResult.data ?? []) {
        const s = holdingStats[h.id]
        if (!s || s.totalShares <= 0) continue
        if (!byTicker[h.ticker]) byTicker[h.ticker] = { name: h.name, currency: h.currency, totalCost: 0, totalShares: 0 }
        byTicker[h.ticker].totalCost += s.totalCost
        byTicker[h.ticker].totalShares += s.totalShares
      }
      setStockHoldingsList(
        Object.entries(byTicker)
          .map(([ticker, d]) => ({ ticker, name: d.name, currency: d.currency, invested: Math.max(0, d.totalCost), totalShares: d.totalShares, avgCostPrice: d.totalShares > 0 ? d.totalCost / d.totalShares : 0 }))
          .sort((a, b) => b.invested - a.invested)
      )

      // 금: 평균 단가 × 보유 수량
      let totalGrams = 0, totalGoldCost = 0
      for (const h of goldRows.data ?? []) {
        if (h.trade_type === "buy") {
          totalGoldCost += Number(h.price_per_gram) * Number(h.grams)
          totalGrams += Number(h.grams)
        } else {
          const avg = totalGrams > 0 ? totalGoldCost / totalGrams : 0
          totalGoldCost -= avg * Number(h.grams)
          totalGrams -= Number(h.grams)
        }
      }
      // 평가금액 우선, 시세 실패 시 매입금액 fallback
      const goldValue = goldQuote?.pricePerGramKrw
        ? totalGrams * goldQuote.pricePerGramKrw
        : Math.max(0, totalGoldCost)

      const savingsRows = savings.data ?? []
      const bondsRows = bonds.data ?? []
      const etcRows = etc.data ?? []

      setPortfolioData({
        stocks: Math.max(0, stocks),
        realestate: (realestate.data ?? []).reduce((acc: number, r: any) => acc + Number(r.current_estimated_price || r.acquisition_price || 0), 0),
        gold: Math.max(0, goldValue),
        cash: (cash.data ?? []).reduce((acc: number, r: any) => acc + Number(r.amount) * (CASH_RATE[r.currency] ?? 1), 0),
        savings: savingsRows.reduce((acc: number, r: any) => acc + Number(r.principal), 0),
        savingsInterest: savingsRows.reduce((acc: number, r: any) => acc + calcExpectedInterest(r), 0),
        bonds: bondsRows.reduce((acc: number, r: any) => acc + Number(r.purchase_price) * Number(r.quantity), 0),
        bondsCoupon: bondsRows.reduce((acc: number, r: any) => acc + Number(r.face_value) * Number(r.quantity) * (Number(r.coupon_rate) / 100), 0),
        etc: etcRows.reduce((acc: number, r: any) => acc + Number(r.current_price), 0),
      })
      setPortfolioLoading(false)
    })
  }, [canView, targetProfile?.id, usdToKrw])

  const totalAsset = useMemo(() => {
    if (!portfolioData) return 0
    return portfolioData.stocks + portfolioData.realestate + portfolioData.gold +
      portfolioData.cash + portfolioData.savings + portfolioData.bonds + portfolioData.etc
  }, [portfolioData])

  const chartData = useMemo(() => {
    if (!portfolioData) return []
    return ASSET_TYPES
      .map(t => ({ name: t.name, value: portfolioData[t.key], color: t.chartColor }))
      .filter(d => d.value > 0)
  }, [portfolioData])

  const mainCategoryName = useMemo(() => {
    if (!chartData.length) return ""
    return [...chartData].sort((a, b) => b.value - a.value)[0].name
  }, [chartData])

  if (targetProfile === undefined) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm animate-pulse">불러오는 중...</div>
      </div>
    )
  }
  if (!targetProfile) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">유저를 찾을 수 없습니다.</div>
      </div>
    )
  }

  const isPublic = !!targetProfile.portfolio_public
  const fmtKrw = (n: number) => `${Math.round(Math.abs(n)).toLocaleString("ko-KR")}원`

  // 카테고리별 표시 데이터
  function getCatDisplay(key: keyof PortfolioData | string): { value: number; pnl: number | null; rate: number | null; pnlLabel?: string } {
    if (!portfolioData) return { value: 0, pnl: null, rate: null }
    switch (key) {
      case "stocks":   return { value: portfolioData.stocks, pnl: null, rate: null }
      case "realestate": return { value: portfolioData.realestate, pnl: null, rate: null }
      case "gold":     return { value: portfolioData.gold, pnl: null, rate: null }
      case "cash":     return { value: portfolioData.cash, pnl: null, rate: null }
      case "savings": {
        const rate = portfolioData.savings > 0 ? (portfolioData.savingsInterest / portfolioData.savings) * 100 : null
        return { value: portfolioData.savings, pnl: portfolioData.savingsInterest > 0 ? portfolioData.savingsInterest : null, rate, pnlLabel: "예상이자" }
      }
      case "bonds": {
        const rate = portfolioData.bonds > 0 ? (portfolioData.bondsCoupon / portfolioData.bonds) * 100 : null
        return { value: portfolioData.bonds, pnl: portfolioData.bondsCoupon > 0 ? portfolioData.bondsCoupon : null, rate, pnlLabel: "연간쿠폰" }
      }
      case "etc":      return { value: portfolioData.etc, pnl: null, rate: null }
      default:         return { value: 0, pnl: null, rate: null }
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader title="프로필" />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 프로필 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[20px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl">
                {targetProfile.avatar_emoji ?? "🐱"}
              </div>
              <div>
                <p className="text-[18px] font-black text-slate-900">{targetProfile.nickname}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px]">{levelMeta.icon}</span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Lv.{levelMeta.level} {levelMeta.title}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {targetProfile.joined_at ? new Date(targetProfile.joined_at).toLocaleDateString("ko-KR") : ""} 가입
                </p>
              </div>
            </div>

            {!isMyself && (
              <button
                onClick={() => toggleFollow({ id: targetProfile.id, nickname: targetProfile.nickname, emoji: targetProfile.avatar_emoji ?? "🐱", level: levelMeta.level })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-black transition-all active:scale-95 ${
                  following ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                }`}
              >
                {following ? <><UserMinus className="w-3.5 h-3.5" /> 팔로잉</> : <><UserPlus className="w-3.5 h-3.5" /> 팔로우</>}
              </button>
            )}
          </div>
        </section>

        {/* 포트폴리오 헤더 */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            포트폴리오
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] font-bold">{isPublic ? "공개" : "비공개"}</span>
          </div>
        </div>

        {canView ? (
          portfolioLoading ? (
            <div className="py-16 text-center text-slate-400 text-[12px] animate-pulse">불러오는 중...</div>
          ) : (
            <>
              {/* 총자산 요약 — 자산 페이지와 동일 */}
              <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900 tracking-tighter truncate">
                    {totalAsset > 0 ? `${Math.round(totalAsset).toLocaleString()}원` : "등록된 자산이 없습니다"}
                  </h2>
                  {totalAsset > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-50 text-slate-400 shrink-0">투자금액 기준</span>
                  )}
                </div>
              </section>

              {/* 자산 구성 비중 — 자산 페이지와 동일 */}
              {chartData.length > 0 && (
                <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
                  <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />자산 구성 비중
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="w-[150px] h-[150px] relative flex items-center justify-center shrink-0">
                      {mounted && <AssetPieChart data={chartData} />}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-[8px] font-black text-slate-300 uppercase">Main</p>
                        <p className="text-[13px] font-black text-slate-800">{mainCategoryName}</p>
                      </div>
                    </div>
                    <div className="flex-1 pl-4 space-y-2.5">
                      {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] font-bold text-slate-500">{item.name}</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">
                            {((item.value / totalAsset) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 카테고리별 카드 — 자산 페이지와 동일 레이아웃 */}
              <div className="space-y-3">
                {ASSET_TYPES.map((type) => {
                  const theme = COLOR_MAP[type.color] ?? COLOR_MAP.emerald
                  const { value, pnl, rate, pnlLabel } = getCatDisplay(type.key)
                  const showPnl = value > 0 && pnl !== null
                  const isSpecialPnl = !!pnlLabel
                  const pnlPositive = isSpecialPnl ? true : (pnl ?? 0) >= 0
                  const href = type.detailPath ? `${type.detailPath}?viewUserId=${userId}` : null

                  // 주식: 아코디언 (수익률 + 증감금액)
                  if (type.key === "stocks") {
                    return (
                      <div key={type.key} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setStockAccordionOpen(v => !v)}
                          className="w-full p-5 flex items-center justify-between active:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 ${theme.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                              <TrendingUp className={`w-5 h-5 ${theme.text}`} />
                            </div>
                            <div className="text-left">
                              <h3 className="text-[14px] font-black text-slate-800">주식</h3>
                              {value > 0 ? (
                                <span className="text-[12px] font-bold text-slate-600">{Math.round(value).toLocaleString()}원</span>
                              ) : (
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5">국내 / 해외</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {value > 0 && totalAsset > 0 && (
                              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                                {((value / totalAsset) * 100).toFixed(1)}%
                              </span>
                            )}
                            {stockHoldingsList.length > 0 && (
                              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${stockAccordionOpen ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </button>
                        {stockAccordionOpen && stockHoldingsList.length > 0 && (
                          <div className="border-t border-slate-50 px-5 pb-2">
                            {stockHoldingsList.map((h) => {
                              const quote = stockQuotes[h.ticker]
                              const rate = h.currency === "USD" ? usdToKrw : 1
                              const currentValue = quote ? h.totalShares * quote.currentPrice * rate : null
                              const pnl = currentValue !== null ? currentValue - h.invested : null
                              const returnRate = pnl !== null && h.invested > 0 ? (pnl / h.invested) * 100 : null
                              const isUp = returnRate !== null && returnRate > 0
                              const isDown = returnRate !== null && returnRate < 0
                              return (
                                <div key={h.ticker} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg shrink-0 ${h.currency === "USD" ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"}`}>
                                      {h.ticker}
                                    </span>
                                    <div>
                                      <p className="text-[12px] font-black text-slate-700">{h.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400">매입 {Math.round(h.invested).toLocaleString()}원</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {currentValue !== null ? (
                                      <>
                                        <p className="text-[12px] font-black text-slate-700">{Math.round(currentValue).toLocaleString()}원</p>
                                        {returnRate !== null && (
                                          <p className={`text-[10px] font-black ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-400"}`}>
                                            {returnRate >= 0 ? "+" : ""}{returnRate.toFixed(2)}%{" "}
                                            ({pnl! >= 0 ? "+" : ""}{Math.round(pnl!).toLocaleString()}원)
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-[12px] font-black text-slate-400">{Math.round(h.invested).toLocaleString()}원</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  const inner = (
                    <>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 ${theme.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                          {type.Icon
                            ? <type.Icon className={`w-5 h-5 ${theme.text}`} />
                            : <span className="text-2xl">{(type as any).emoji}</span>
                          }
                        </div>
                        <div>
                          <h3 className="text-[14px] font-black text-slate-800">{type.name}</h3>
                          {value > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[12px] font-bold text-slate-600">
                                {Math.round(value).toLocaleString()}원
                              </span>
                              {showPnl && (
                                <span className={`text-[10px] font-black ${pnlPositive ? "text-rose-500" : "text-blue-500"}`}>
                                  {isSpecialPnl
                                    ? `${pnlLabel} +${fmtKrw(pnl!)}`
                                    : `${pnlPositive ? "+" : "-"}${fmtKrw(pnl!)}${rate !== null ? ` (${pnlPositive ? "+" : "-"}${Math.abs(rate).toFixed(1)}%)` : ""}`
                                  }
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">{type.description}</p>
                          )}
                        </div>
                      </div>
                      {value > 0 && totalAsset > 0 && (
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg shrink-0">
                          {((value / totalAsset) * 100).toFixed(1)}%
                        </span>
                      )}
                    </>
                  )

                  return href ? (
                    <Link
                      key={type.key}
                      href={href}
                      className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all active:scale-[0.99]"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={type.key}
                      className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
            </>
          )
        ) : (
          <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm">
            <div className="px-5 py-10 text-center text-slate-300">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-[12px] font-bold">
                {!following
                  ? "팔로우하면 공개 포트폴리오를 볼 수 있어요"
                  : "이 유저는 포트폴리오를 비공개로 설정했습니다"}
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
