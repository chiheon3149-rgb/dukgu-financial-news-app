"use client"

// =============================================================================
// 한 눈에 보기 - 시장 트리맵 (Recharts Treemap)
// =============================================================================

import { useState } from "react"
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
  marketCap: number
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
      value: stock.marketCap > 0 ? stock.marketCap : 1e10,
      changeRate: stock.changeRate,
      ticker: stock.ticker,
    })
  }

  return Object.entries(sectorMap).map(([name, children]) => ({ name, children }))
}

// ─── CustomCell (recharts content prop) ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomCell(props: any) {
  const { x, y, width, height, depth, name, changeRate } = props

  if (depth === 1) {
    // 섹터 레이어: 투명 배경 + 섹터명 레이블
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
          <ResponsiveContainer width="100%" height={320}>
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
      <div className="w-full h-[320px] bg-slate-800 rounded-xl animate-pulse" />
    ),
  }
)

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function MarketTreemap({ krStocks, usStocks }: MarketTreemapProps) {
  const [market, setMarket] = useState<"kr" | "us">("kr")

  const data = buildTreemapData(
    market === "kr" ? krStocks : usStocks,
    market === "kr" ? KR_SECTORS : US_SECTORS
  )

  return (
    <section className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.05)] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-900">한 눈에 보기</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">시가총액 기준 · 색상은 등락률</p>
        </div>
        {/* 한국/미국 토글 */}
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

      {/* 다크 컨테이너 */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        {data.length > 0 ? (
          <TreemapChart data={data} />
        ) : (
          <div className="h-[320px] flex items-center justify-center text-slate-500 text-[13px] font-bold">
            데이터 로딩 중...
          </div>
        )}
      </div>
    </section>
  )
}
