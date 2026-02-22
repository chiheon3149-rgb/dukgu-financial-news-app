"use client"

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import type { AvgCostDataPoint } from "@/types"

// =============================================================================
// 📊 TradeChart
//
// [수정 내용]
// recharts의 TooltipProps 제네릭 타입은 내부적으로 NameType이 number|string을
// 모두 허용하는 유니온이라, 우리가 string으로 좁히면 타입 충돌이 납니다.
// 해결책: TooltipProps를 import하지 않고 필요한 props만 직접 정의합니다.
// 이 방식이 recharts와 함께 쓸 때 실무에서도 가장 안전한 패턴입니다.
// =============================================================================

interface TradeChartProps {
  data: AvgCostDataPoint[]
  currentPrice?: number
  currency: "KRW" | "USD"
}

// recharts가 content prop으로 넘겨주는 실제 값의 타입을 직접 정의합니다.
// TooltipProps import 없이 필요한 것만 뽑아씁니다.
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: AvgCostDataPoint }>
  label?: string
  currency: "KRW" | "USD"
}

function formatPrice(value: number, currency: "KRW" | "USD"): string {
  if (currency === "KRW") {
    return value >= 10_000
      ? `${(value / 10_000).toFixed(1)}만`
      : value.toLocaleString("ko-KR")
  }
  return `$${value.toFixed(2)}`
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as AvgCostDataPoint

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-3 text-left">
      <p className="text-[10px] font-bold text-slate-400 mb-1">{d.date}</p>
      <p className="text-[12px] font-black text-slate-700">
        평단가 {formatPrice(d.avgCost, currency)}
      </p>
      {d.tradePrice != null && (
        <p className={`text-[11px] font-bold mt-0.5 ${
          d.tradeType === "buy" ? "text-emerald-500" : "text-rose-500"
        }`}>
          {d.tradeType === "buy" ? "▲ 매수" : "▼ 매도"}{" "}
          {formatPrice(d.tradePrice, currency)} × {d.shares}주
        </p>
      )}
    </div>
  )
}

export function TradeChart({ data, currentPrice, currency }: TradeChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">
        매매 내역을 추가하면 차트가 표시됩니다
      </div>
    )
  }

  const buyPoints = data.filter((d) => d.tradeType === "buy")
  const sellPoints = data.filter((d) => d.tradeType === "sell")

  const allPrices = data
    .flatMap((d) => [d.avgCost, d.tradePrice ?? 0])
    .concat(currentPrice ?? 0)
    .filter(Boolean)
  const minY = Math.min(...allPrices) * 0.95
  const maxY = Math.max(...allPrices) * 1.05

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
            tickFormatter={(v) => v.slice(5)}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
            tickFormatter={(v) => formatPrice(v, currency)}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          {/* content prop에 타입 단언(as any)으로 currency를 안전하게 주입합니다 */}
          <Tooltip
            content={(props) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <CustomTooltip {...(props as any)} currency={currency} />
            )}
          />

          {currentPrice && (
            <ReferenceLine
              y={currentPrice}
              stroke="#3b82f6"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `현재 ${formatPrice(currentPrice, currency)}`,
                position: "insideTopRight",
                fontSize: 9,
                fill: "#3b82f6",
                fontWeight: 700,
              }}
            />
          )}

          <Line
            type="stepAfter"
            dataKey="avgCost"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="평단가"
          />

          <Scatter data={buyPoints} dataKey="tradePrice" fill="#10b981" name="매수" />
          <Scatter data={sellPoints} dataKey="tradePrice" fill="#f43f5e" name="매도" />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <span className="w-5 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-[9px] font-bold text-slate-400">평단가</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-[9px] font-bold text-slate-400">매수</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span className="text-[9px] font-bold text-slate-400">매도</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 border-t-2 border-dashed border-blue-500 inline-block" />
          <span className="text-[9px] font-bold text-slate-400">현재가</span>
        </div>
      </div>
    </div>
  )
}
