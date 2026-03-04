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
          <Pie
            data={data}
            cx={80} cy={80}
            innerRadius={55}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            cornerRadius={6}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      )
    }
  }),
  { ssr: false, loading: () => <div className="w-[160px] h-[160px] flex items-center justify-center text-slate-200">...</div> }
)

const ASSET_TYPES = [
  { id: "stocks",      name: "주식",    description: "국내 / 해외",    icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { id: "realestate",  name: "부동산",  description: "아파트, 토지 등", icon: Landmark,   color: "indigo",  href: "/assets/realestate" },
  { id: "crypto",      name: "코인",    description: "BTC, ETH 등",    icon: Bitcoin,    color: "amber",   href: "/assets/crypto"     },
  { id: "gold",        name: "금",      description: "금 현물",        emoji: "🥇",       color: "yellow",  href: "/assets/gold"       },
  { id: "cash",        name: "현금",    description: "원화, 외화",      icon: Banknote,   color: "emerald", href: "/assets/cash"       },
  { id: "savings",     name: "예·적금", description: "정기 예금, 적금", icon: Building2,  color: "blue",    href: "/assets/savings"    },
  { id: "bonds",       name: "채권",    description: "국채, 회사채",    icon: ScrollText, color: "indigo",  href: "/assets/bonds"      },
  { id: "etc",         name: "기타",    description: "미술품, 자동차",  icon: Package,    color: "rose",    href: "/assets/etc"        },
]

const COLOR_MAP: Record<string, any> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500", hover: "hover:border-emerald-200" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500",  hover: "hover:border-indigo-200"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-500",   hover: "hover:border-amber-200"   },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-500",  hover: "hover:border-yellow-200"  },
  blue:    { bg: "bg-blue-50",    text: "text-blue-500",    hover: "hover:border-blue-200"    },
  rose:    { bg: "bg-rose-50",    text: "text-rose-500",    hover: "hover:border-rose-200"    },
}

// localStorage 헬퍼
function readLocalJson<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export default function AssetsPage() {
  const { profile } = useUser()
  const [mounted, setMounted] = useState(false)
  const usdToKrw = useExchangeRate()
  const { rows: stockRows } = useStockPortfolio(usdToKrw)
  const { totalValueUsd: cryptoTotalUsd } = useCryptoPortfolio()

  const [realEstateTotal, setRealEstateTotal] = useState(0)
  const [goldTotal, setGoldTotal] = useState(0)
  const [cashTotal, setCashTotal] = useState(0)
  const [savingsTotal, setSavingsTotal] = useState(0)
  const [bondsTotal, setBondsTotal] = useState(0)
  const [etcTotal, setEtcTotal] = useState(0)

  // 코인 총액 (hook에서 받은 USD × 환율)
  const cryptoTotal = cryptoTotalUsd * usdToKrw

  // 마운트 시: DB 자산 + localStorage 자산 로드
  useEffect(() => {
    setMounted(true)
    if (profile?.id) fetchRealEstateTotal()
    loadSavingsTotal()
    loadBondsTotal()
    loadGoldTotal()
    loadEtcTotal()
  }, [profile?.id])

  // 환율 업데이트 시 현금 총액 재계산
  useEffect(() => {
    if (usdToKrw > 0) loadCashTotal(usdToKrw)
  }, [usdToKrw])

  // 부동산: Supabase에서 조회
  const fetchRealEstateTotal = async () => {
    const { data } = await supabase
      .from("asset_realestate")
      .select("current_estimated_price, acquisition_price")
      .eq("user_id", profile?.id)
    const sum = data?.reduce((acc, cur) => acc + (cur.current_estimated_price || cur.acquisition_price || 0), 0) || 0
    setRealEstateTotal(sum)
  }

  // 금: localStorage 보유량 계산 + API 시세 조회
  const loadGoldTotal = async () => {
    try {
      const holdings = readLocalJson<any>("dukgu:gold-holdings")
      if (!holdings.length) return

      const sorted = [...holdings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      let totalGrams = 0, totalCost = 0
      for (const h of sorted) {
        if (h.type === "buy") {
          totalCost += h.pricePerGram * h.grams
          totalGrams += h.grams
        } else {
          const avg = totalGrams > 0 ? totalCost / totalGrams : 0
          totalCost -= avg * h.grams
          totalGrams -= h.grams
        }
      }
      if (totalGrams <= 0) return

      const res = await fetch("/api/market/gold")
      if (!res.ok) return
      const { pricePerGramKrw } = await res.json()
      setGoldTotal(totalGrams * pricePerGramKrw)
    } catch {}
  }

  // 현금: localStorage → 원화 환산 (환율 의존)
  const loadCashTotal = (rate: number) => {
    const items = readLocalJson<any>("dukgu:cash-holdings")
    const RATE: Record<string, number> = { KRW: 1, USD: rate, EUR: 1550, JPY: 9.8, CNY: 198 }
    const total = items.reduce((acc: number, i: any) => acc + (i.amount || 0) * (RATE[i.currency] ?? 1), 0)
    setCashTotal(total)
  }

  // 예·적금: localStorage 원금 합산
  const loadSavingsTotal = () => {
    const items = readLocalJson<any>("dukgu:savings-holdings")
    setSavingsTotal(items.reduce((acc: number, i: any) => acc + (i.principal || 0), 0))
  }

  // 채권: localStorage 투자금 합산 (매입단가 × 수량)
  const loadBondsTotal = () => {
    const items = readLocalJson<any>("dukgu:bond-holdings")
    setBondsTotal(items.reduce((acc: number, i: any) => acc + (i.purchasePrice || 0) * (i.quantity || 0), 0))
  }

  // 기타: localStorage 현재 추정가 합산
  const loadEtcTotal = () => {
    const items = readLocalJson<any>("dukgu:etc-holdings")
    setEtcTotal(items.reduce((acc: number, i: any) => acc + (i.currentPrice || 0), 0))
  }

  // 주식 총액 (원화 환산)
  const stockTotalKrw = useMemo(() => {
    return stockRows.reduce((acc, row) => {
      const rate = row.holding.currency === "USD" ? usdToKrw : 1
      return acc + (row.currentValue * rate)
    }, 0)
  }, [stockRows, usdToKrw])

  // 전체 자산 합산
  const totalAssetKrw = stockTotalKrw + realEstateTotal + cryptoTotal + goldTotal + cashTotal + savingsTotal + bondsTotal + etcTotal

  // 차트용 데이터 (값 있는 항목만)
  const chartData = useMemo(() => [
    { name: "주식",   value: stockTotalKrw,  color: "#10b981" },
    { name: "부동산", value: realEstateTotal, color: "#6366f1" },
    { name: "코인",   value: cryptoTotal,    color: "#f59e0b" },
    { name: "금",     value: goldTotal,      color: "#eab308" },
    { name: "현금",   value: cashTotal,      color: "#22c55e" },
    { name: "예·적금",value: savingsTotal,   color: "#3b82f6" },
    { name: "채권",   value: bondsTotal,     color: "#8b5cf6" },
    { name: "기타",   value: etcTotal,       color: "#f43f5e" },
  ].filter(d => d.value > 0), [stockTotalKrw, realEstateTotal, cryptoTotal, goldTotal, cashTotal, savingsTotal, bondsTotal, etcTotal])

  const mainCategoryName = useMemo(() => {
    if (chartData.length === 0) return "데이터 없음"
    return [...chartData].sort((a, b) => b.value - a.value)[0].name
  }, [chartData])

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

            const categoryValue =
              type.id === "stocks"     ? stockTotalKrw  :
              type.id === "realestate" ? realEstateTotal :
              type.id === "crypto"     ? cryptoTotal     :
              type.id === "gold"       ? goldTotal       :
              type.id === "cash"       ? cashTotal       :
              type.id === "savings"    ? savingsTotal    :
              type.id === "bonds"      ? bondsTotal      :
              type.id === "etc"        ? etcTotal        : 0

            return (
              <Link
                key={type.id}
                href={type.href}
                className={`flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm ${theme.hover} transition-all group active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${theme.bg} rounded-2xl flex items-center justify-center`}>
                    {Icon ? <Icon className={`w-5 h-5 ${theme.text}`} /> : <span className="text-2xl">{type.emoji}</span>}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-slate-800">{type.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400">
                      {categoryValue > 0 ? `${Math.round(categoryValue).toLocaleString()}원` : type.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {categoryValue > 0 && totalAssetKrw > 0 && (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                      {((categoryValue / totalAssetKrw) * 100).toFixed(1)}%
                    </span>
                  )}
                  <ChevronRight className={`w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors`} />
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
