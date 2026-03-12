"use client"

// =============================================================================
// 📊 주식 상세 페이지 (4단계 + 5단계)
//
// 4단계: 헤더(뒤로가기+찜하기) + 현재가 + 부드러운 영역형 차트 + 기간 선택
// 5단계: 회사 소개 텍스트 박스 + 주요 지표 2열 카드 + 하단 고정 매수/매도 버튼
// =============================================================================

import { useState, use } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, TrendingUp, TrendingDown } from "lucide-react"
import { MOCK_STOCK_DETAILS, MOCK_STOCK_DEFAULT } from "@/lib/mock/market"

// ── 차트 컴포넌트 (서버사이드 렌더링 비활성화) ───────────────────────────────
// 💡 Recharts는 브라우저에서만 동작하기 때문에,
//    서버에서 미리 그리지 않고 브라우저에서만 그려줘요. (dynamic import)
const StockAreaChart = dynamic(
  () => import("recharts").then((re) => {
    const { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } = re

    return function Chart({ data, color, positive }: {
      data: { price: number; time: string }[]
      color: string
      positive: boolean
    }) {
      const gradientId = "stockGradient"
      return (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {/* 💡 그라데이션: 차트 위쪽은 진하고, 아래쪽은 투명하게 자연스럽게 퍼져요 */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            {/* X/Y 축은 숨겨서 차트를 깔끔하게 유지해요 */}
            <XAxis  dataKey="time" hide />
            <YAxis  hide domain={["auto", "auto"]} />
            {/* 마우스를 올렸을 때 가격을 작게 보여줘요 */}
            <Tooltip
              contentStyle={{
                background: "white",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 900,
              }}
              itemStyle={{ color: color }}
              formatter={(v: number) => [v.toLocaleString(), "가격"]}
              labelFormatter={() => ""}
            />
            {/* 💡 type="monotone"이 곡선을 부드럽게 만들어줘요 */}
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "white" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      // 차트 로딩 중 스켈레톤
      <div className="w-full h-[200px] flex items-end gap-1 px-4 pb-2">
        {[40, 60, 45, 70, 55, 80, 65, 90, 75, 85, 70, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 rounded-t-lg animate-pulse"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  }
)

// 기간 선택 옵션
const PERIODS = ["1일", "1주", "1달", "1년"] as const
type Period = typeof PERIODS[number]

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  // 💡 URL에서 티커 코드를 꺼내요 (예: /assets/stock/AAPL → ticker = "AAPL")
  const { ticker } = use(params)

  const router   = useRouter()
  const [liked,   setLiked]   = useState(false)  // 찜하기 상태
  const [period,  setPeriod]  = useState<Period>("1일")  // 선택된 기간

  // 💡 티커로 종목 데이터를 찾아요. 없으면 기본값(MOCK_STOCK_DEFAULT)을 사용해요
  const stock = MOCK_STOCK_DETAILS[ticker.toUpperCase()] ?? {
    ...MOCK_STOCK_DEFAULT,
    ticker,
    name: ticker,
  }

  const isUp      = stock.changeRate >= 0
  const chartColor = isUp ? "#10b981" : "#f43f5e"  // 상승=에메랄드, 하락=빨강
  const chartData  = stock.chartData[period] ?? stock.chartData["1일"]

  const priceDisplay = stock.currency === "USD"
    ? `$${stock.currentPrice.toFixed(2)}`
    : `${stock.currentPrice.toLocaleString()}원`

  const changeDisplay = stock.currency === "USD"
    ? `${isUp ? "+" : ""}$${stock.changeAmount.toFixed(2)}`
    : `${isUp ? "+" : ""}${stock.changeAmount.toLocaleString()}원`

  return (
    <div className="min-h-dvh bg-[#F4F6F9]">

      {/* ══════════════════════════════════════════════════════════════════
          4단계 ①: 헤더 — 뒤로가기 + 종목명 + 찜하기 버튼
          💡 이 헤더는 어떤 주식을 보고 있는지 알려주는 '이름표' 역할이에요
      ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-[56px] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-[14px] hover:bg-slate-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="text-center">
            <p className="text-[16px] font-black text-slate-900">{stock.name}</p>
            <p className="text-[10px] font-bold text-slate-400">{stock.ticker} · {stock.market}</p>
          </div>

          {/* 💡 하트 버튼 — 누르면 빨갛게 채워지며 '관심 종목'에 추가돼요 */}
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className="p-2 rounded-[14px] hover:bg-slate-100 active:scale-90 transition-all"
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${
              liked ? "fill-rose-400 text-rose-400 scale-110" : "text-slate-300"
            }`} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-48 space-y-4 pt-4">

        {/* ══════════════════════════════════════════════════════════════
            4단계 ②: 현재가 + 등락률 — 크고 굵게!
            💡 현재가는 '지금 이 주식을 사면 얼마야?' 를 알려줘요
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-[28px] shadow-sm px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[32px] font-black text-slate-900 leading-tight">{priceDisplay}</p>
              <div className="flex items-center gap-2 mt-2">
                {isUp
                  ? <TrendingUp   className="w-4 h-4 text-emerald-500" />
                  : <TrendingDown className="w-4 h-4 text-rose-500"   />
                }
                <span className={`text-[14px] font-black ${isUp ? "text-emerald-600" : "text-rose-500"}`}>
                  {changeDisplay}
                </span>
                {/* 등락률 뱃지 */}
                <span className={`text-[12px] font-black px-2.5 py-0.5 rounded-full ${
                  isUp ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                }`}>
                  {isUp ? "▲" : "▼"} {Math.abs(stock.changeRate).toFixed(2)}%
                </span>
              </div>
            </div>
            {/* 로고 배지 */}
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white font-black text-[18px] shrink-0"
              style={{ backgroundColor: stock.color }}
            >
              {stock.initial}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              4단계 ③: 부드러운 영역형 차트
              💡 가격이 시간에 따라 어떻게 변했는지 그림으로 보여줘요!
          ══════════════════════════════════════════════════════════ */}
          <div className="mt-5 -mx-2">
            <StockAreaChart data={chartData} color={chartColor} positive={isUp} />
          </div>

          {/* ══════════════════════════════════════════════════════════
              4단계 ④: 기간 선택 버튼 (1일 / 1주 / 1달 / 1년)
              💡 버튼 모양: 둥글둥글한 알약처럼 생겼어요
          ══════════════════════════════════════════════════════════ */}
          <div className="flex gap-2 mt-4 justify-center">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all active:scale-95 ${
                  period === p
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5단계 ①: 회사 소개 — 초보자도 이해하기 쉬운 말로!
            💡 이 텍스트 박스는 '이 회사가 뭐 하는 데야?' 를 쉽게 설명해줘요
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-[28px] shadow-sm p-6">
          <h3 className="text-[13px] font-black text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            이 회사는 어떤 회사예요?
          </h3>
          <p className="text-[13px] font-bold text-slate-600 leading-relaxed">
            {stock.description}
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5단계 ②: 주요 지표 — 2열 타일 카드
            💡 시가총액, PER 같은 숫자들이에요.
               마치 상품 라벨처럼 회사의 핵심 정보를 한눈에 보여줘요!
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-[28px] shadow-sm p-6">
          <h3 className="text-[13px] font-black text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-400 rounded-full" />
            주요 지표
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {stock.stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-50 rounded-[18px] px-4 py-3.5"
              >
                <p className="text-[10px] font-bold text-slate-400 mb-1">{stat.label}</p>
                <p className="text-[15px] font-black text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════════════
          5단계 ③: 하단 고정 버튼 — 매수(사기) / 매도(팔기)
          💡 이 버튼들은 화면 맨 아래에 항상 고정되어 있어요.
             마치 가게의 '결제 버튼'처럼 언제든지 누를 수 있게 배치했어요!
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40">
        <div className="max-w-md mx-auto px-4 pb-3 pt-3 bg-white/95 backdrop-blur-md border-t border-slate-100">
          <div className="flex gap-3">
            {/* 매수(사기) 버튼 */}
            <button
              type="button"
              className="flex-1 py-4 rounded-[20px] bg-emerald-500 text-white font-black text-[16px] shadow-lg shadow-emerald-200 active:scale-[0.97] transition-all hover:bg-emerald-600"
              onClick={() => alert("💡 실제 매수 기능은 준비 중이에요!")}
            >
              구매하기
            </button>
            {/* 매도(팔기) 버튼 */}
            <button
              type="button"
              className="flex-1 py-4 rounded-[20px] bg-rose-50 text-rose-500 font-black text-[16px] border border-rose-200 active:scale-[0.97] transition-all hover:bg-rose-100"
              onClick={() => alert("💡 실제 매도 기능은 준비 중이에요!")}
            >
              판매하기
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
