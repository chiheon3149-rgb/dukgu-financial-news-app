"use client"

// =============================================================================
// 📊 주식 상세 페이지 — 실제 데이터 연동 버전
//
// 데이터 흐름:
//   브라우저 → GET /api/stock/[ticker] → Python fetch_stock.py → 야후 파이낸스
//
// [A] 헤더 + 핵심 가격 정보
// [B] 부드러운 영역형 차트 + 기간 선택
// [C] 회사랑 친해지기 카드
// [D] 주요 지표 2×3 타일 그리드
// [E] 최신 뉴스 리스트 (현재 API 미지원 — 향후 확장)
// [F] 하단 고정 매수/매도 버튼
// =============================================================================

import { useState, useEffect, useCallback, use } from "react"
import dynamic                       from "next/dynamic"
import { useRouter }                 from "next/navigation"
import { ArrowLeft, Bookmark, Building2, Briefcase, User2 } from "lucide-react"
import { supabase }                  from "@/lib/supabase"
import { useWatchlist }              from "@/hooks/use-watchlist"

// =============================================================================
// 📐 타입 정의
// =============================================================================

interface StockProfile {
  name:                 string
  currency:             string      // "USD" | "KRW"
  exchange:             string      // "NMS", "KSC" 등
  sector:               string
  industry:             string
  country:              string
  website:              string
  full_time_employees:  number | null
  summary:              string      // 회사 설명 (영문)
  ceo:                  string
  listing_date:         string      // "1980년 12월 12일" 형식
  // ★ 현재가 & 등락
  current_price:        number | null
  change_amount:        number
  change_rate:          number      // %, 예: 1.53 → 1.53%
  prev_close:           number | null
  // 지표
  market_cap_fmt:       string
  per_fmt:              string
  dividend_yield_fmt:   string
  "52w_high_fmt":       string
  "52w_low_fmt":        string
  volume_fmt:           string
}

interface ChartPoint {
  date:  string   // "2025-03-12"
  close: number
}

interface StockApiResponse {
  error:      boolean
  ticker:     string
  fetched_at: string
  profile:    StockProfile
  chart_data: ChartPoint[]
  message?:   string
}

// =============================================================================
// 🎨 헬퍼: 티커 → 고정 색상 (로고 배지에 사용)
// =============================================================================

const PALETTE = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#f97316"]

function tickerToColor(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

// =============================================================================
// 📈 [B] Recharts 영역 차트 — 동적 임포트 (SSR 비활성화)
// =============================================================================

const StockAreaChart = dynamic(
  () => import("recharts").then((re) => {
    const { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } = re

    return function Chart({ data, upColor }: {
      data: { price: number; time: string }[]
      upColor: string
    }) {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={upColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={upColor} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#fff", border: "none",
                borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                padding: "8px 14px", fontSize: "13px", fontWeight: 900, color: upColor,
              }}
              formatter={(v: number) => [v.toLocaleString(), ""]}
              labelFormatter={(label: string) => label}
              cursor={{ stroke: upColor, strokeWidth: 1.5, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone" dataKey="price"
              stroke={upColor} strokeWidth={2.8}
              fill="url(#areaGrad)" dot={false}
              activeDot={{ r: 6, fill: upColor, stroke: "#fff", strokeWidth: 2.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] flex items-end gap-1 px-2 pb-2">
        {[35,55,40,68,50,78,62,88,72,82,68,92,76,84].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t-md animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  }
)

// =============================================================================
// ⏳ 로딩 스켈레톤
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-[#F2F4F8] animate-pulse">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="w-9 h-9 bg-slate-100 rounded-[12px]" />
          <div className="w-24 h-5 bg-slate-100 rounded-full" />
          <div className="w-9 h-9 bg-slate-100 rounded-[12px]" />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-4">
        <div className="bg-white rounded-[24px] p-6 space-y-4" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-[18px]" />
            <div className="space-y-2">
              <div className="w-32 h-5 bg-slate-100 rounded-full" />
              <div className="w-20 h-3 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="w-40 h-10 bg-slate-100 rounded-full" />
          <div className="w-full h-[220px] bg-slate-50 rounded-[16px]" />
        </div>
        <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }}>
          <div className="w-24 h-4 bg-slate-100 rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-[18px] px-4 py-3.5 space-y-2">
                <div className="w-12 h-3 bg-slate-100 rounded-full" />
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// =============================================================================
// 🚨 에러 카드
// =============================================================================

function ErrorCard({ ticker, message, onBack }: { ticker: string; message: string; onBack: () => void }) {
  return (
    <div className="min-h-dvh bg-[#F2F4F8] flex items-center justify-center px-6">
      <div className="bg-white rounded-[24px] p-8 text-center max-w-sm w-full" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }}>
        <div className="text-4xl mb-4">📡</div>
        <p className="text-[16px] font-black text-slate-900 mb-2">{ticker} 데이터를 불러오지 못했어요</p>
        <p className="text-[12px] font-bold text-slate-400 mb-6 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-slate-900 text-white rounded-[14px] font-black text-[14px] active:scale-95 transition-all"
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// 기간 탭 정의
// =============================================================================

const PERIODS = ["5분", "15분", "1시간", "1일", "1주", "1달", "1년"] as const
type Period = typeof PERIODS[number]

const INTRADAY_INTERVAL: Partial<Record<Period, string>> = {
  "5분":   "5m",
  "15분":  "15m",
  "1시간": "1h",
}

const DAILY_SLICE: Partial<Record<Period, number>> = {
  "1일":  5,
  "1주":  7,
  "1달":  22,
  "1년":  9999,
}

// =============================================================================
// 🏠 메인 페이지 컴포넌트
// =============================================================================

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const router     = useRouter()

  // ── UI 상태 ────────────────────────────────────────────────────────────────
  const { toggle: toggleWatchlist, isWatched } = useWatchlist()
  const [period, setPeriod] = useState<Period>("1년")

  // ── 프로필 데이터 상태 (최초 1회 로드) ─────────────────────────────────────
  const [data,      setData]      = useState<StockApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [krName,    setKrName]    = useState<string | null>(null)

  // ── 차트 전용 상태 ─────────────────────────────────────────────────────────
  const [chartPoints,   setChartPoints]   = useState<{ time: string; price: number }[]>([])
  const [chartLoading,  setChartLoading]  = useState(false)

  // ── 프로필 데이터 최초 로드 ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadStock() {
      setIsLoading(true)
      setError(null)

      try {
        const res  = await fetch(`/api/stock/${encodeURIComponent(ticker)}`)
        const json = await res.json() as StockApiResponse

        if (cancelled) return

        if (json.error) {
          setError(json.message ?? "데이터를 불러오지 못했어요.")
        } else {
          setData(json)
        }
      } catch {
        if (!cancelled) setError("네트워크 오류가 발생했어요.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadStock()
    return () => { cancelled = true }
  }, [ticker])

  // ── 한국 종목이면 Supabase에서 한국어 이름 조회 ──────────────────────────
  useEffect(() => {
    if (!ticker.endsWith(".KS") && !ticker.endsWith(".KQ")) return
    supabase
      .from("kr_stocks")
      .select("name")
      .eq("ticker", ticker)
      .single()
      .then(({ data: row }) => { if (row?.name) setKrName(row.name) })
  }, [ticker])

  // ── 기간 탭 변경 시 차트 데이터 업데이트 ───────────────────────────────────
  const updateChart = useCallback(async (p: Period, rawData: StockApiResponse | null) => {
    if (!rawData) return

    const intradayInterval = INTRADAY_INTERVAL[p]

    if (intradayInterval) {
      setChartLoading(true)
      try {
        const res  = await fetch(`/api/stock/${encodeURIComponent(ticker)}/chart?interval=${intradayInterval}`)
        const json = await res.json()
        if (!json.error) {
          setChartPoints(json.chart_data.map((pt: { date: string; close: number }) => ({
            time:  pt.date,
            price: pt.close,
          })))
        }
      } catch {
      } finally {
        setChartLoading(false)
      }
    } else {
      const sliceCount = DAILY_SLICE[p] ?? 9999
      setChartPoints(
        rawData.chart_data.slice(-sliceCount).map((pt) => {
          const [, mo, d] = pt.date.split("-")
          return { time: `${parseInt(mo)}/${parseInt(d)}`, price: pt.close }
        })
      )
    }
  }, [ticker])

  useEffect(() => {
    updateChart(period, data)
  }, [period, data, updateChart])

  // ── 로딩/에러 처리 ─────────────────────────────────────────────────────────
  if (isLoading)          return <LoadingSkeleton />
  if (error || !data)     return <ErrorCard ticker={ticker.toUpperCase()} message={error ?? "알 수 없는 오류"} onBack={() => router.back()} />

  // =============================================================================
  // 💡 데이터 렌더링 변수 정리
  // =============================================================================

  const p          = data.profile
  const isUp       = p.change_rate >= 0
  const upColor    = isUp ? "#f43f5e" : "#3b82f6"
  const logoColor  = tickerToColor(ticker)
  const displayName = krName ?? p.name
  const initial    = (displayName || ticker)[0].toUpperCase()

  // 💡 수정됨: 한국/미국 주식 구분 없이 토스증권 로고 URL 생성
  const isKoreanStock = ticker.endsWith(".KS") || ticker.endsWith(".KQ")
  const cleanTicker = isKoreanStock ? ticker.split(".")[0] : ticker
  const finalLogoUrl = `https://static.toss.im/png-icons/securities/icn-sec-fill-${cleanTicker}.png`

  const priceDisplay = p.currency === "KRW"
    ? `${Math.round(p.current_price ?? 0).toLocaleString()}원`
    : `$${(p.current_price ?? 0).toFixed(2)}`

  const changeDisplay = p.currency === "KRW"
    ? `${Math.abs(Math.round(p.change_amount)).toLocaleString()}원`
    : `$${Math.abs(p.change_amount).toFixed(2)}`

  const marketLabel = p.currency === "KRW" ? "한국" : "미국"

  const stats = [
    { label: "시가총액",   value: p.market_cap_fmt,      hint: "이 회사 전체의 가격이에요" },
    { label: "PER",        value: p.per_fmt,              hint: "주가 ÷ 이익, 낮을수록 싸요" },
    { label: "배당수익률", value: p.dividend_yield_fmt,   hint: "1년에 받는 배당금 비율이에요" },
    { label: "52주 최고",  value: p["52w_high_fmt"],      hint: "최근 1년 중 가장 비쌌던 가격" },
    { label: "52주 최저",  value: p["52w_low_fmt"],       hint: "최근 1년 중 가장 쌌던 가격" },
    { label: "거래량",     value: p.volume_fmt,           hint: "오늘 사고판 주식의 수예요" },
  ]

  const cardCls   = "bg-white rounded-[24px] p-6"
  const shadowStyle = { boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }

  // =============================================================================
  // 🖥️ 실제 렌더링 시작
  // =============================================================================

  return (
    <div className="min-h-dvh bg-[#F2F4F8]">

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
        <div className="max-w-md mx-auto px-4 h-[56px] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="text-center">
            <p className="text-[16px] font-black text-slate-900 leading-tight">{displayName}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{data.ticker} · {marketLabel} 상장</p>
          </div>

          <button
            type="button"
            onClick={() => toggleWatchlist(ticker, displayName)}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <Bookmark className={`w-5 h-5 transition-all duration-200 ${isWatched(ticker) ? "fill-emerald-500 text-emerald-500" : "text-slate-300"}`} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-4">

        {/* ════════════════════════════════════════════════════════════════════
            [A+B] 가격 정보 + 차트 카드
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>

          {/* 💡 수정됨: 통합 토스 로고 및 Fallback UI 적용 */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-14 h-14 rounded-[18px] overflow-hidden shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] bg-slate-50 flex items-center justify-center">
              <img
                src={finalLogoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-white font-black text-[22px] hidden"
                style={{ backgroundColor: logoColor }}
              >
                {initial}
              </div>
            </div>
            
            <div>
              <p className="text-[22px] font-black text-slate-900 leading-tight">{displayName}</p>
              <p className="text-[11px] font-bold text-slate-400">{data.ticker} · {p.exchange}</p>
            </div>
          </div>

          <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight">{priceDisplay}</p>

          {/* 등락률 뱃지 */}
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-black ${
              isUp
                ? "bg-rose-50 text-rose-500 border border-rose-200"
                : "bg-blue-50 text-blue-500 border border-blue-200"
            }`}>
              {isUp ? "▲" : "▼"} {Math.abs(p.change_rate).toFixed(2)}%
            </span>
            <span className={`text-[13px] font-bold ${isUp ? "text-rose-400" : "text-blue-400"}`}>
              {isUp ? "+" : "-"}{changeDisplay}
            </span>
            <span className="text-[11px] font-bold text-slate-300 ml-auto">전일 대비</span>
          </div>

          {/* 기간 선택 버튼 */}
          <div className="mt-4 overflow-x-auto scrollbar-none -mx-1 px-1">
            <div className="bg-slate-50 rounded-[16px] p-1 flex gap-1 w-max min-w-full">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-2 rounded-[12px] text-[12px] font-black transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    period === p
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 차트 */}
          <div className="mt-4 -mx-2 relative">
            {chartLoading ? (
              <div className="w-full h-[220px] flex items-end gap-1 px-2 pb-2">
                {[35,55,40,68,50,78,62,88,72,82,68,92,76,84].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-100 rounded-t-md animate-pulse" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : chartPoints.length > 0 ? (
              <StockAreaChart data={chartPoints} upColor={upColor} />
            ) : (
              <div className="w-full h-[220px] flex items-center justify-center text-[13px] font-bold text-slate-400">
                차트 데이터가 없어요
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            [C] 회사랑 친해지기 카드
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">🏢 회사랑 친해져 볼까요?</h3>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">상장일</p>
                <p className="text-[13px] font-black text-slate-800">
                  {p.listing_date}
                  {p.listing_date !== "-" && <span className="text-slate-400 font-bold"> (아주 오랜 전통!)</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">주요 사업</p>
                <p className="text-[13px] font-black text-slate-800">{p.industry}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-violet-50 flex items-center justify-center shrink-0">
                <User2 className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">CEO (대표이사)</p>
                <p className="text-[13px] font-black text-slate-800">{p.ceo}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[16px] px-4 py-3.5">
            <p className="text-[12px] font-bold text-slate-500 leading-relaxed line-clamp-5">
              {p.summary}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            [D] 주요 지표 2×3 타일 그리드
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">📊 건강 상태 체크</h3>

          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-[18px] px-4 py-3.5 space-y-1">
                <p className="text-[10px] font-bold text-slate-400">{stat.label}</p>
                <p className="text-[16px] font-black text-slate-900 leading-tight">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 leading-snug">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 데이터 갱신 시각 */}
        <p className="text-center text-[10px] font-bold text-slate-300">
          데이터 기준: {new Date(data.fetched_at).toLocaleString("ko-KR")}
        </p>

      </main>

    </div>
  )
}