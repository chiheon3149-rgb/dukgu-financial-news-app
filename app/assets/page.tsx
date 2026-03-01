"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  Wallet, TrendingUp, Landmark, Bitcoin, Banknote,
  Building2, ScrollText, Package, ChevronRight, PieChart as PieIcon, Loader2
} from "lucide-react"
import Link from "next/link"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AdBanner } from "@/components/dukgu/ad-banner"
import { useStockPortfolio } from "@/hooks/use-stock-portfolio"
import { useExchangeRate } from "@/hooks/use-exchange-rate"

// 📊 [그래프 강제 출력] SSR 방지 및 고정 크기 렌더링
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

// 🎨 8종 자산 설정 (기획자님 요청 반영)
const ASSET_TYPES = [
  { id: "stocks",      name: "주식",    description: "국내 / 해외",    icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { id: "realestate",  name: "부동산",  description: "아파트, 토지 등", icon: Landmark,   color: "indigo",  href: "/assets/realestate" },
  { id: "crypto",      name: "코인",    description: "BTC, ETH 등",    icon: Bitcoin,    color: "amber",   href: "/assets/crypto"      },
  { id: "gold",        name: "금",      description: "금 현물",        emoji: "🥇",       color: "yellow",  href: "/assets/gold"        },
  { id: "cash",        name: "현금",    description: "원화, 외화",      icon: Banknote,   color: "emerald", href: "/assets/cash"        },
  { id: "savings",     name: "예·적금", description: "정기 예금, 적금", icon: Building2,  color: "blue",    href: "/assets/savings"     },
  { id: "bonds",       name: "채권",    description: "국채, 회사채",    icon: ScrollText, color: "indigo",  href: "/assets/bonds"       },
  { id: "etc",         name: "기타",    description: "미술품, 자동차",  icon: Package,    color: "rose",    href: "/assets/etc"         },
]

const COLOR_MAP: Record<string, any> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500", hover: "hover:border-emerald-200" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500",  hover: "hover:border-indigo-200"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-500",   hover: "hover:border-amber-200"   },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-500",  hover: "hover:border-yellow-200"  },
  blue:    { bg: "bg-blue-50",    text: "text-blue-500",    hover: "hover:border-blue-200"    },
  rose:    { bg: "bg-rose-50",    text: "text-rose-500",    hover: "hover:border-rose-200"    },
}

export default function AssetsPage() {
  const [mounted, setMounted] = useState(false)
  const usdToKrw = useExchangeRate()
  const { rows } = useStockPortfolio(usdToKrw)

  useEffect(() => { setMounted(true) }, [])

  // 1️⃣ 실시간 주식 데이터 및 임시 자산 데이터
  const stockTotalKrw = useMemo(() => {
    return rows.reduce((acc, row) => {
      const rate = row.holding.currency === "USD" ? usdToKrw : 1
      return acc + (row.currentValue * rate)
    }, 0)
  }, [rows, usdToKrw])

  const realEstateTotalKrw = 350000000 
  const cashTotalKrw = 12500000
  const totalAssetKrw = stockTotalKrw + realEstateTotalKrw + cashTotalKrw

  // 📊 차트용 데이터 (비중이 있는 것만 표시)
  const chartData = useMemo(() => [
    { name: "주식", value: stockTotalKrw || 0, color: "#10b981" },
    { name: "부동산", value: realEstateTotalKrw, color: "#6366f1" },
    { name: "현금", value: cashTotalKrw, color: "#f59e0b" },
  ].filter(d => d.value > 0), [stockTotalKrw, realEstateTotalKrw, cashTotalKrw])

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack={false}
        title={<div className="flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500 fill-emerald-500" /><span className="text-lg font-black text-slate-900">내 자산</span></div>}
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">
        
        {/* 🏆 1. 총자산 요약 (한 줄 구성) */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter truncate">
              {Math.round(totalAssetKrw).toLocaleString()}원
            </h2>
            <div className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 shrink-0">
              상위 5%
            </div>
          </div>
        </section>

        {/* 📊 2. 자산 구성 비중 (차트 + 실시간 % 리스트) */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2 mb-4">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />자산 구성 비중
          </h3>
          
          <div className="flex items-center justify-between">
            {/* 왼쪽: 차트 */}
            <div className="w-[160px] h-[160px] relative flex items-center justify-center shrink-0">
              {mounted && <AssetPieChart data={chartData} />}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[8px] font-black text-slate-300 uppercase">Main</p>
                <p className="text-[14px] font-black text-slate-800">
                  {chartData.sort((a,b) => b.value - a.value)[0]?.name || "-"}
                </p>
              </div>
            </div>

            {/* 오른쪽: % 수치 리스트 */}
            <div className="flex-1 pl-6 space-y-3">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-bold text-slate-500">{item.name}</span>
                  </div>
                  <span className="text-[13px] font-black text-slate-800">
                    {((item.value / (totalAssetKrw || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 📋 3. 상세 현황 (버튼 제거) */}
        <div className="flex items-center px-1">
          <h2 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />상세 현황
          </h2>
        </div>

        <div className="grid gap-3">
          {ASSET_TYPES.map((type) => {
            const theme = COLOR_MAP[type.color] || COLOR_MAP.emerald
            const Icon = type.icon
            const categoryValue = type.id === "stocks" ? stockTotalKrw : type.id === "realestate" ? realEstateTotalKrw : type.id === "cash" ? cashTotalKrw : 0

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
                  {categoryValue > 0 && (
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