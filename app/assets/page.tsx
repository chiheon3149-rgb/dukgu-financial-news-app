"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  Wallet, TrendingUp, Landmark, Bitcoin, Banknote,
  Building2, ScrollText, Package, ChevronRight, PieChart as PieIcon
} from "lucide-react"
import Link from "next/link"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AdBanner } from "@/components/dukgu/ad-banner"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { useUser } from "@/context/user-context"
import { supabase } from "@/lib/supabase"
import { useCryptoPortfolio } from "@/hooks/use-crypto-portfolio"

// 📊 [그래프] SSR 방지
const AssetPieChart = dynamic(
  () => import("recharts").then((re) => {
    const { PieChart, Pie, Cell } = re
    return function Chart({ data }: { data: any[] }) {
      return (
        <PieChart width={160} height={160}>
          <Pie data={data} cx={80} cy={80} innerRadius={55} outerRadius={75}
            paddingAngle={5} dataKey="value" stroke="none" cornerRadius={6} isAnimationActive={false}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Pie>
        </PieChart>
      )
    }
  }),
  { ssr: false, loading: () => <div className="w-[160px] h-[160px] flex items-center justify-center text-slate-200">...</div> }
)

const ASSET_TYPES = [
  { id: "stocks",     name: "주식",    description: "국내 / 해외",    icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { id: "realestate", name: "부동산",  description: "아파트, 토지 등", icon: Landmark,   color: "indigo",  href: "/assets/realestate" },
  { id: "crypto",     name: "코인",    description: "BTC, ETH 등",    icon: Bitcoin,    color: "amber",   href: "/assets/crypto"     },
  { id: "gold",       name: "금",      description: "금 현물",        emoji: "🥇",       color: "yellow",  href: "/assets/gold"       },
  { id: "cash",       name: "현금",    description: "원화, 외화",      icon: Banknote,   color: "emerald", href: "/assets/cash"       },
  { id: "savings",    name: "예·적금", description: "정기 예금, 적금", icon: Building2,  color: "blue",    href: "/assets/savings"    },
  { id: "bonds",      name: "채권",    description: "국채, 회사채",    icon: ScrollText, color: "indigo",  href: "/assets/bonds"      },
  { id: "etc",        name: "기타",    description: "미술품, 자동차",  icon: Package,    color: "rose",    href: "/assets/etc"        },
]

const COLOR_MAP: Record<string, any> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500", hover: "hover:border-emerald-200" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500",  hover: "hover:border-indigo-200"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-500",   hover: "hover:border-amber-200"   },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-500",  hover: "hover:border-yellow-200"  },
  blue:    { bg: "bg-blue-50",    text: "text-blue-500",    hover: "hover:border-blue-200"    },
  rose:    { bg: "bg-rose-50",    text: "text-rose-500",    hover: "hover:border-rose-200"    },
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

export default function AssetsPage() {
  const { user, profile } = useUser()
  const [mounted, setMounted] = useState(false)
  const usdToKrw = useExchangeRate()
  const { rows: stockRows } = useStockPortfolio(usdToKrw)
  const { rows: cryptoRows, totalValueUsd: cryptoTotalUsd } = useCryptoPortfolio()

  // 부동산
  const [realEstateValue, setRealEstateValue] = useState(0)
  const [realEstateInvested, setRealEstateInvested] = useState(0)
  // 금
  const [goldValue, setGoldValue] = useState(0)
  const [goldInvested, setGoldInvested] = useState(0)
  // 현금 (환율 의존 → raw items 저장 후 useMemo)
  const [cashItems, setCashItems] = useState<Array<{ currency: string; amount: number }>>([])
  // 예·적금
  const [savingsPrincipal, setSavingsPrincipal] = useState(0)
  const [savingsInterest, setSavingsInterest] = useState(0)
  // 채권
  const [bondsInvested, setBondsInvested] = useState(0)
  const [bondsCoupon, setBondsCoupon] = useState(0)
  // 기타
  const [etcValue, setEtcValue] = useState(0)
  const [etcInvested, setEtcInvested] = useState(0)

  // 주식
  const stockValue = useMemo(() =>
    stockRows.reduce((acc, r) => acc + r.currentValue * (r.holding.currency === "USD" ? usdToKrw : 1), 0),
    [stockRows, usdToKrw])
  const stockInvested = useMemo(() =>
    stockRows.reduce((acc, r) => acc + r.stats.totalInvested * (r.holding.currency === "USD" ? usdToKrw : 1), 0),
    [stockRows, usdToKrw])

  // 코인
  const cryptoValue = cryptoTotalUsd * usdToKrw
  const cryptoInvested = useMemo(() =>
    cryptoRows.reduce((acc, r) => acc + r.stats.totalInvested * usdToKrw, 0),
    [cryptoRows, usdToKrw])

  // 현금 원화 환산
  const CASH_RATE: Record<string, number> = { KRW: 1, USD: usdToKrw, EUR: 1550, JPY: 9.8, CNY: 198 }
  const cashTotal = useMemo(() =>
    cashItems.reduce((acc, i) => acc + i.amount * (CASH_RATE[i.currency] ?? 1), 0),
    [cashItems, usdToKrw])

  // 마운트 + 데이터 로드
  useEffect(() => {
    setMounted(true)
    if (!user) return

    const uid = user.id

    // 부동산
    supabase
      .from("asset_realestate")
      .select("current_estimated_price, acquisition_price")
      .eq("user_id", uid)
      .then(({ data }) => {
        const rows = data ?? []
        setRealEstateValue(rows.reduce((acc, r) => acc + Number(r.current_estimated_price || r.acquisition_price || 0), 0))
        setRealEstateInvested(rows.reduce((acc, r) => acc + Number(r.acquisition_price || 0), 0))
      })

    // 금: DB 보유량 → API 시세
    supabase
      .from("asset_gold")
      .select("trade_date, price_per_gram, grams, trade_type")
      .eq("user_id", uid)
      .then(async ({ data }) => {
        if (!data?.length) return
        const sorted = [...data].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
        let totalGrams = 0, totalCost = 0
        for (const h of sorted) {
          if (h.trade_type === "buy") {
            totalCost += Number(h.price_per_gram) * Number(h.grams)
            totalGrams += Number(h.grams)
          } else {
            const avg = totalGrams > 0 ? totalCost / totalGrams : 0
            totalCost -= avg * Number(h.grams)
            totalGrams -= Number(h.grams)
          }
        }
        if (totalGrams <= 0) return
        setGoldInvested(totalCost)
        try {
          const res = await fetch("/api/market/gold")
          if (res.ok) {
            const { pricePerGramKrw } = await res.json()
            setGoldValue(totalGrams * pricePerGramKrw)
          }
        } catch {}
      })

    // 현금
    supabase
      .from("asset_cash")
      .select("currency, amount")
      .eq("user_id", uid)
      .then(({ data }) => {
        setCashItems((data ?? []).map(r => ({ currency: r.currency, amount: Number(r.amount) })))
      })

    // 예·적금
    supabase
      .from("asset_savings")
      .select("type, principal, annual_rate, start_date, end_date, monthly_amount")
      .eq("user_id", uid)
      .then(({ data }) => {
        const rows = data ?? []
        setSavingsPrincipal(rows.reduce((acc, r) => acc + Number(r.principal), 0))
        setSavingsInterest(rows.reduce((acc, r) => acc + calcExpectedInterest(r), 0))
      })

    // 채권
    supabase
      .from("asset_bonds")
      .select("face_value, quantity, coupon_rate, purchase_price")
      .eq("user_id", uid)
      .then(({ data }) => {
        const rows = data ?? []
        setBondsInvested(rows.reduce((acc, r) => acc + Number(r.purchase_price) * Number(r.quantity), 0))
        setBondsCoupon(rows.reduce((acc, r) => acc + Number(r.face_value) * Number(r.quantity) * (Number(r.coupon_rate) / 100), 0))
      })

    // 기타
    supabase
      .from("asset_etc")
      .select("purchase_price, current_price")
      .eq("user_id", uid)
      .then(({ data }) => {
        const rows = data ?? []
        setEtcValue(rows.reduce((acc, r) => acc + Number(r.current_price), 0))
        setEtcInvested(rows.reduce((acc, r) => acc + Number(r.purchase_price), 0))
      })

  }, [user?.id])

  // 전체 자산 합산
  const totalAssetKrw = stockValue + realEstateValue + cryptoValue + goldValue + cashTotal + savingsPrincipal + bondsInvested + etcValue

  // 차트용 데이터
  const chartData = useMemo(() => [
    { name: "주식",    value: stockValue,       color: "#10b981" },
    { name: "부동산",  value: realEstateValue,  color: "#6366f1" },
    { name: "코인",    value: cryptoValue,      color: "#f59e0b" },
    { name: "금",      value: goldValue,        color: "#eab308" },
    { name: "현금",    value: cashTotal,        color: "#22c55e" },
    { name: "예·적금", value: savingsPrincipal, color: "#3b82f6" },
    { name: "채권",    value: bondsInvested,    color: "#8b5cf6" },
    { name: "기타",    value: etcValue,         color: "#f43f5e" },
  ].filter(d => d.value > 0), [stockValue, realEstateValue, cryptoValue, goldValue, cashTotal, savingsPrincipal, bondsInvested, etcValue])

  const mainCategoryName = useMemo(() => {
    if (chartData.length === 0) return "데이터 없음"
    return [...chartData].sort((a, b) => b.value - a.value)[0].name
  }, [chartData])

  // 카테고리별 표시 데이터 계산
  interface CatDisplay { value: number; pnl: number | null; rate: number | null; pnlLabel?: string }
  function getCatDisplay(id: string): CatDisplay {
    switch (id) {
      case "stocks": {
        const pnl = stockValue - stockInvested
        const rate = stockInvested > 0 ? (pnl / stockInvested) * 100 : null
        return { value: stockValue, pnl: stockValue > 0 ? pnl : null, rate }
      }
      case "realestate": {
        const pnl = realEstateValue - realEstateInvested
        const rate = realEstateInvested > 0 ? (pnl / realEstateInvested) * 100 : null
        return { value: realEstateValue, pnl: realEstateValue > 0 ? pnl : null, rate }
      }
      case "crypto": {
        const pnl = cryptoValue - cryptoInvested
        const rate = cryptoInvested > 0 ? (pnl / cryptoInvested) * 100 : null
        return { value: cryptoValue, pnl: cryptoValue > 0 ? pnl : null, rate }
      }
      case "gold": {
        const pnl = goldValue - goldInvested
        const rate = goldInvested > 0 ? (pnl / goldInvested) * 100 : null
        return { value: goldValue, pnl: goldValue > 0 ? pnl : null, rate }
      }
      case "cash":
        return { value: cashTotal, pnl: null, rate: null }
      case "savings": {
        const rate = savingsPrincipal > 0 ? (savingsInterest / savingsPrincipal) * 100 : null
        return { value: savingsPrincipal, pnl: savingsInterest > 0 ? savingsInterest : null, rate, pnlLabel: "예상이자" }
      }
      case "bonds": {
        const rate = bondsInvested > 0 ? (bondsCoupon / bondsInvested) * 100 : null
        return { value: bondsInvested, pnl: bondsCoupon > 0 ? bondsCoupon : null, rate, pnlLabel: "연간쿠폰" }
      }
      case "etc": {
        const pnl = etcValue - etcInvested
        const rate = etcInvested > 0 ? (pnl / etcInvested) * 100 : null
        return { value: etcValue, pnl: etcValue > 0 ? pnl : null, rate }
      }
      default:
        return { value: 0, pnl: null, rate: null }
    }
  }

  const fmtKrw = (n: number) => `${Math.round(Math.abs(n)).toLocaleString("ko-KR")}원`

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack={false}
        title={<div className="flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500 fill-emerald-500" /><span className="text-lg font-black text-slate-900">내 자산</span></div>}
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 총자산 요약 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter truncate">
              {totalAssetKrw > 0 ? `${Math.round(totalAssetKrw).toLocaleString()}원` : "자산을 등록해보세요"}
            </h2>
            {totalAssetKrw > 0 && (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 shrink-0">
                실시간 집계중
              </div>
            )}
          </div>
        </section>

        {/* 자산 구성 비중 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2 mb-4">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />자산 구성 비중
          </h3>
          {chartData.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="w-[160px] h-[160px] relative flex items-center justify-center shrink-0">
                {mounted && <AssetPieChart data={chartData} />}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[8px] font-black text-slate-300 uppercase">Main</p>
                  <p className="text-[14px] font-black text-slate-800">{mainCategoryName}</p>
                </div>
              </div>
              <div className="flex-1 pl-6 space-y-3">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-bold text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-[13px] font-black text-slate-800">
                      {((item.value / totalAssetKrw) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <PieIcon className="w-8 h-8 text-slate-200 mx-auto" />
              <p className="text-[12px] font-bold text-slate-400">등록된 자산 데이터가 없습니다.</p>
            </div>
          )}
        </section>

        {/* 상세 현황 */}
        <div className="flex items-center px-1">
          <h2 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />상세 현황
          </h2>
        </div>

        <div className="grid gap-3">
          {ASSET_TYPES.map((type) => {
            const theme = COLOR_MAP[type.color] || COLOR_MAP.emerald
            const Icon = type.icon
            const { value, pnl, rate, pnlLabel } = getCatDisplay(type.id)

            // PnL 표시: 특수 라벨(예상이자/연간쿠폰)은 항상 양수, 일반 PnL은 부호 있음
            const showPnl = value > 0 && pnl !== null
            const isSpecialPnl = !!pnlLabel
            const pnlPositive = isSpecialPnl ? true : (pnl ?? 0) >= 0

            return (
              <Link
                key={type.id}
                href={type.href}
                className={`flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm ${theme.hover} transition-all group active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${theme.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                    {Icon ? <Icon className={`w-5 h-5 ${theme.text}`} /> : <span className="text-2xl">{type.emoji}</span>}
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
                <div className="flex items-center gap-2 shrink-0">
                  {value > 0 && totalAssetKrw > 0 && (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                      {((value / totalAssetKrw) * 100).toFixed(1)}%
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="pt-2"><AdBanner /></div>
      </main>
    </div>
  )
}
