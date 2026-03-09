"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RefreshCw } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"

type MainTab = "indices" | "bonds" | "commodities"
type RegionTab = "all" | "kr" | "us"

interface LiveIndex {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
  region: "kr" | "us"
}

interface LiveQuote {
  ticker: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

// 지수·환율
const INDEX_SYMBOLS = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X", "JPYKRW=X"]

// 채권 — 미국 (야후 파이낸스)
const BOND_SYMBOLS_US = ["^IRX", "^FVX", "^TNX", "^TYX"]

// 원자재
const COMMODITY_SYMBOLS = ["GC=F", "SI=F", "CL=F", "NG=F", "HG=F"]

const BOND_META: Record<string, string> = {
  "^IRX": "미국 국채 2년",
  "^FVX": "미국 국채 5년",
  "^TNX": "미국 국채 10년",
  "^TYX": "미국 국채 30년",
}

const COMMODITY_META: Record<string, { name: string; unit: string }> = {
  "GC=F": { name: "금",      unit: "달러/트로이온스" },
  "SI=F": { name: "은",      unit: "달러/트로이온스" },
  "CL=F": { name: "WTI 원유", unit: "달러/배럴" },
  "NG=F": { name: "천연가스", unit: "달러/MMBtu" },
  "HG=F": { name: "구리",    unit: "달러/파운드" },
}

const SYMBOL_REGION: Record<string, "kr" | "us"> = {
  "^KS11": "kr", "^KQ11": "kr", "KRW=X": "kr", "JPYKRW=X": "kr",
  "^DJI":  "us", "^NDX":  "us", "^GSPC": "us", "^RUT":     "us",
}

function fmtPrice(sym: string, price: number): string {
  if (sym.includes("=X") && !sym.includes("YT=")) {
    const val = sym === "JPYKRW=X" ? price * 100 : price
    return `${val.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`
  }
  if (sym.startsWith("^K")) {
    return price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
  }
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MarketRow({ name, value, change, status, unit }: {
  name: string; value: string; change: string; status: "up" | "down" | "same"; unit?: string
}) {
  const isUp   = status === "up"
  const isDown = status === "down"
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-slate-700">{name}</p>
        {unit && <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>}
      </div>
      <div className="text-right">
        <p className={`text-[16px] font-black ${isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-700"}`}>
          {value}
        </p>
        <p className={`text-[11px] font-semibold ${isUp ? "text-rose-400" : isDown ? "text-blue-400" : "text-slate-400"}`}>
          {change}
        </p>
      </div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-4 pt-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

const REFRESH_INTERVAL = 30_000 // 30초

export default function MarketPage() {
  const [mainTab, setMainTab]     = useState<MainTab>("indices")
  const [regionTab, setRegionTab] = useState<RegionTab>("all")

  const [indices, setIndices]         = useState<LiveIndex[]>([])
  const [usBonds, setUsBonds]         = useState<LiveQuote[]>([])
  const [krBonds, setKrBonds]         = useState<{ name: string; currentPrice: number | null; change: number; changePercent: number }[]>([])
  const [commodities, setCommodities] = useState<LiveQuote[]>([])

  const [indicesLoading, setIndicesLoading]         = useState(true)
  const [bondsLoading, setBondsLoading]             = useState(false)
  const [commoditiesLoading, setCommoditiesLoading] = useState(false)
  const [refreshing, setRefreshing]                 = useState(false)
  const [fetchedAt, setFetchedAt]                   = useState<Date | null>(null)

  // 로드 완료 여부 추적 (30초 자동 갱신 대상 결정용)
  const bondsLoaded       = useRef(false)
  const commoditiesLoaded = useRef(false)
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadIndices = useCallback(async (silent = false) => {
    if (!silent) setIndicesLoading(true)
    try {
      const res = await fetch("/api/market/indices")
      if (!res.ok) return
      const data = await res.json()
      const mapped: LiveIndex[] = (data.indices ?? []).map((q: any) => ({
        symbol:       q.symbol,
        name:         q.name,
        price:        q.price,
        change:       q.change,
        changeRate:   q.changeRate,
        changeStatus: q.changeStatus,
        region:       SYMBOL_REGION[q.symbol] ?? "us",
      }))
      setIndices(mapped)
      setFetchedAt(new Date())
    } finally {
      if (!silent) setIndicesLoading(false)
    }
  }, [])

  const loadBonds = useCallback(async (silent = false) => {
    if (!silent) setBondsLoading(true)
    try {
      const [usRes, krRes] = await Promise.all([
        fetch(`/api/market/quotes?tickers=${BOND_SYMBOLS_US.join(",")}`),
        fetch("/api/market/bonds-kr"),
      ])
      if (usRes.ok) setUsBonds(await usRes.json())
      if (krRes.ok) {
        const krData = await krRes.json()
        setKrBonds(krData.bonds ?? [])
      }
      bondsLoaded.current = true
      setFetchedAt(new Date())
    } finally {
      if (!silent) setBondsLoading(false)
    }
  }, [])

  const loadCommodities = useCallback(async (silent = false) => {
    if (!silent) setCommoditiesLoading(true)
    try {
      const res = await fetch(`/api/market/quotes?tickers=${COMMODITY_SYMBOLS.join(",")}`)
      if (!res.ok) return
      const data = await res.json()
      setCommodities(data)
      commoditiesLoaded.current = true
      setFetchedAt(new Date())
    } finally {
      if (!silent) setCommoditiesLoading(false)
    }
  }, [])

  // 최초 로드
  useEffect(() => { loadIndices() }, [loadIndices])

  // 탭 전환 시 최초 1회 lazy load
  useEffect(() => {
    if (mainTab === "bonds" && !bondsLoaded.current) loadBonds()
    if (mainTab === "commodities" && !commoditiesLoaded.current) loadCommodities()
  }, [mainTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // 30초 자동 갱신
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadIndices(true)
      if (bondsLoaded.current) loadBonds(true)
      if (commoditiesLoaded.current) loadCommodities(true)
    }, REFRESH_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loadIndices, loadBonds, loadCommodities])

  const handleRefresh = async () => {
    setRefreshing(true)
    if (mainTab === "indices") await loadIndices()
    else if (mainTab === "bonds") await loadBonds()
    else await loadCommodities()
    setRefreshing(false)
  }

  // ── 필터 적용 ──
  const filteredIndices = indices.filter((i) => regionTab === "all" || i.region === regionTab)

  const usBondRows = usBonds.map((q) => ({
    name:   BOND_META[q.ticker] ?? q.name,
    value:  `${q.currentPrice.toFixed(3)}%`,
    change: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`,
    status: q.changePercent > 0 ? "up" as const : q.changePercent < 0 ? "down" as const : "same" as const,
    region: "us" as const,
  }))

  const krBondRows = krBonds
    .filter((q) => q.currentPrice !== null)
    .map((q) => ({
      name:   q.name,
      value:  `${q.currentPrice!.toFixed(3)}%`,
      change: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(3)}%p`,
      status: q.changePercent > 0 ? "up" as const : q.changePercent < 0 ? "down" as const : "same" as const,
      region: "kr" as const,
    }))

  const bondRows = [
    ...(regionTab !== "kr" ? usBondRows : []),
    ...(regionTab !== "us" ? krBondRows : []),
  ]

  const commodityRows = commodities.map((q) => ({
    name:   COMMODITY_META[q.ticker]?.name ?? q.name,
    value:  q.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    change: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`,
    status: q.changePercent > 0 ? "up" as const : q.changePercent < 0 ? "down" as const : "same" as const,
    unit:   COMMODITY_META[q.ticker]?.unit,
  }))

  const isLoading =
    mainTab === "indices"     ? indicesLoading :
    mainTab === "bonds"       ? bondsLoading   :
    commoditiesLoading

  return (
    <div className="min-h-dvh bg-white">
      <DetailHeader
        title="주요 지수"
        rightElement={
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {fetchedAt
              ? fetchedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : ""}
          </button>
        }
      />

      <div className="max-w-md mx-auto">
        {/* 메인 탭 */}
        <div className="flex border-b border-slate-100 px-5">
          {([ ["indices", "지수·환율"], ["bonds", "채권"], ["commodities", "원자재"] ] as [MainTab, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                onClick={() => setMainTab(id)}
                className={`flex-1 py-3 text-[13px] font-black transition-all ${
                  mainTab === id
                    ? "text-slate-900 border-b-2 border-slate-900"
                    : "text-slate-400 border-b-2 border-transparent"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* 지역 필터 */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-50">
          {([ ["all", "전체"], ["kr", "국내"], ["us", "해외"] ] as [RegionTab, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                onClick={() => setRegionTab(id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  regionTab === id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {label}
              </button>
            )
          )}
          {/* 30초 갱신 인디케이터 */}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-slate-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            30초 갱신
          </span>
        </div>

        {/* 데이터 영역 */}
        <div className="px-5 pb-24">
          {isLoading ? (
            <SkeletonRows />
          ) : mainTab === "indices" ? (
            filteredIndices.length === 0 ? (
              <p className="text-center text-sm text-slate-300 font-bold py-16">데이터가 없습니다</p>
            ) : (
              filteredIndices.map((idx) => (
                <MarketRow
                  key={idx.symbol}
                  name={idx.name}
                  value={fmtPrice(idx.symbol, idx.price)}
                  change={`${idx.changeRate >= 0 ? "+" : ""}${idx.changeRate.toFixed(2)}%`}
                  status={idx.changeStatus}
                />
              ))
            )
          ) : mainTab === "bonds" ? (
            bondRows.length === 0 ? (
              <p className="text-center text-sm text-slate-300 font-bold py-16">데이터가 없습니다</p>
            ) : (
              bondRows.map((b, i) => (
                <MarketRow key={i} name={b.name} value={b.value} change={b.change} status={b.status} />
              ))
            )
          ) : commodityRows.length === 0 ? (
            <p className="text-center text-sm text-slate-300 font-bold py-16">데이터가 없습니다</p>
          ) : (
            commodityRows.map((c, i) => (
              <MarketRow key={i} name={c.name} value={c.value} change={c.change} status={c.status} unit={c.unit} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
