"use client"

// =============================================================================
// 한 눈에 보기 - 시장 트리맵 (Recharts Treemap)
// =============================================================================

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// ─── 타입 정의 ───────────────────────────────────────────────────────────────

interface TopStock {
  ticker: string
  displayTicker: string
  name: string
  changeRate: number
  price: number
  currency: "KRW" | "USD"
  volume: number
  tradingValue: number
}

interface TreemapLeaf {
  name: string
  displayTicker: string
  value: number
  changeRate: number
  ticker: string
}

interface TreemapData {
  name: string
  children: TreemapLeaf[]
}

export interface MarketTreemapProps {
  krStocks: TopStock[]
  usStocks: TopStock[]
}

// ─── 섹터 매핑 ────────────────────────────────────────────────────────────────

const KR_SECTORS: Record<string, string> = {
  "005930.KS": "전기전자", "000660.KS": "전기전자",
  "373220.KS": "전기전자", "066570.KS": "전기전자",
  "005380.KS": "자동차",   "000270.KS": "자동차",
  "012330.KS": "자동차",
  "035420.KS": "IT",       "035720.KS": "IT",
  "207940.KS": "제약",     "068270.KS": "제약",
  "028260.KS": "금융",
}

const US_SECTORS: Record<string, string> = {
  "AAPL":  "IT서비스", "MSFT":  "IT서비스",
  "GOOGL": "IT서비스", "META":  "IT서비스",
  "NVDA":  "반도체",
  "AMZN":  "경기소비재", "TSLA": "경기소비재",
  "JPM":   "금융",     "V":     "금융",
  "LLY":   "헬스케어",
}

// ─── 트리맵 데이터 빌더 ───────────────────────────────────────────────────────

function buildTreemapData(stocks: TopStock[], sectors: Record<string, string>): TreemapData[] {
  const sectorMap: Record<string, TreemapLeaf[]> = {}

  for (const stock of stocks) {
    const sectorKey = sectors[stock.ticker] ?? "기타"
    if (!sectorMap[sectorKey]) sectorMap[sectorKey] = []
    sectorMap[sectorKey].push({
      name: stock.name,
      displayTicker: stock.displayTicker,
      value: stock.tradingValue > 0 ? stock.tradingValue : 1e10,
      changeRate: stock.changeRate,
      ticker: stock.ticker,
    })
  }

  return Object.entries(sectorMap).map(([name, children]) => ({ name, children }))
}

// ─── 섹터별 평균 등락률 계산 ──────────────────────────────────────────────────

interface SectorStat {
  name: string
  avgRate: number
  count: number
}

function buildSectorStats(stocks: TopStock[], sectors: Record<string, string>): SectorStat[] {
  const map: Record<string, { sum: number; count: number }> = {}

  for (const stock of stocks) {
    const sector = sectors[stock.ticker] ?? "기타"
    if (!map[sector]) map[sector] = { sum: 0, count: 0 }
    map[sector].sum += stock.changeRate
    map[sector].count++
  }

  return Object.entries(map)
    .map(([name, { sum, count }]) => ({ name, avgRate: sum / count, count }))
    .sort((a, b) => b.avgRate - a.avgRate)
}

// ─── CustomCell (recharts content prop) ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomCell(props: any) {
  const { x, y, width, height, depth, name, changeRate } = props

  if (depth === 1) {
    return (
      <g>
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          fill="transparent"
          rx={2}
        />
        <text
          x={x + 5}
          y={y + 14}
          className="text-[9px] fill-slate-400 font-bold"
          fontSize={9}
          fill="#94a3b8"
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
    )
  }

  if (depth === 2) {
    const rate = typeof changeRate === "number" ? changeRate : 0
    const isUp = rate >= 0
    const opacity = Math.min(0.9, 0.3 + Math.abs(rate) * 0.12)
    const fill = isUp
      ? `rgba(244,63,94,${opacity})`
      : `rgba(59,130,246,${opacity})`

    const showLabel = width > 50 && height > 28

    return (
      <g>
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          fill={fill}
          rx={2}
        />
        {showLabel && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontWeight="bold"
              fontSize={11}
            >
              {name.length > 6 ? name.slice(0, 5) + "…" : name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 9}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={9}
            >
              {isUp ? "▲" : "▼"}{Math.abs(rate).toFixed(1)}%
            </text>
          </>
        )}
      </g>
    )
  }

  return null
}

// ─── Recharts Treemap (동적 임포트, SSR 비활성화) ─────────────────────────────

const TreemapChart = dynamic(
  () =>
    import("recharts").then((re) => {
      const { Treemap, ResponsiveContainer } = re
      return function Chart({ data }: { data: TreemapData[] }) {
        return (
          <ResponsiveContainer width="100%" height={280}>
            <Treemap
              data={data}
              dataKey="value"
              aspectRatio={1.5}
              content={<CustomCell />}
            />
          </ResponsiveContainer>
        )
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] bg-slate-800 rounded-xl animate-pulse" />
    ),
  }
)

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function MarketTreemap({ krStocks, usStocks }: MarketTreemapProps) {
  const [market, setMarket] = useState<"kr" | "us">("kr")
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  // 마켓 전환 시 섹터 필터 초기화
  useEffect(() => { setSelectedSector(null) }, [market])

  const stocks  = market === "kr" ? krStocks : usStocks
  const sectors = market === "kr" ? KR_SECTORS : US_SECTORS

  const sectorStats = buildSectorStats(stocks, sectors)
  const sectorNames = sectorStats.map((s) => s.name)

  const filteredStocks = selectedSector
    ? stocks.filter((s) => (sectors[s.ticker] ?? "기타") === selectedSector)
    : stocks

  const data = buildTreemapData(filteredStocks, sectors)

  return (
    <section className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.05)] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-900">한 눈에 보기</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">시가총액 기준 · 색상은 등락률</p>
        </div>
        <div className="bg-slate-100 rounded-[10px] p-0.5 flex gap-0.5">
          <button
            onClick={() => setMarket("kr")}
            className={`text-[11px] font-black px-2.5 py-1 rounded-[8px] transition-colors ${
              market === "kr" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}
          >
            한국
          </button>
          <button
            onClick={() => setMarket("us")}
            className={`text-[11px] font-black px-2.5 py-1 rounded-[8px] transition-colors ${
              market === "us" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}
          >
            미국
          </button>
        </div>
      </div>

      {/* 색상 범례 */}
      <div className="flex items-center gap-3 mb-3 text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> 상승
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> 하락
        </span>
      </div>

      {/* 섹터 필터 칩 */}
      {sectorNames.length > 0 && (
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-3">
          <div className="flex gap-1.5 w-max">
            <button
              onClick={() => setSelectedSector(null)}
              className={`text-[11px] font-black px-3 py-1 rounded-full border transition-colors shrink-0 ${
                selectedSector === null
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              전체
            </button>
            {sectorNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedSector(selectedSector === name ? null : name)}
                className={`text-[11px] font-black px-3 py-1 rounded-full border transition-colors shrink-0 ${
                  selectedSector === name
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 다크 트리맵 */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        {data.length > 0 ? (
          <TreemapChart data={data} />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500 text-[13px] font-bold">
            데이터 로딩 중...
          </div>
        )}
      </div>

      {/* 섹터별 평균 등락률 */}
      {sectorStats.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-black text-slate-500 mb-2">섹터별 평균 등락률</p>
          <div className="space-y-2">
            {sectorStats.map((s) => {
              const isUp = s.avgRate >= 0
              const barWidth = Math.min(100, Math.abs(s.avgRate) * 15)
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSelectedSector(selectedSector === s.name ? null : s.name)}
                  className={`w-full flex items-center gap-3 py-1.5 px-2 rounded-xl transition-colors text-left ${
                    selectedSector === s.name ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[12px] font-semibold text-slate-700 w-16 shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isUp ? "bg-rose-400" : "bg-blue-400"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-[12px] font-black w-14 text-right shrink-0 ${isUp ? "text-rose-500" : "text-blue-500"}`}>
                    {isUp ? "▲" : "▼"}{Math.abs(s.avgRate).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{s.count}종목</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
