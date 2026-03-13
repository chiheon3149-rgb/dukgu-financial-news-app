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
import { ArrowLeft, Heart, Building2, Briefcase, User2 } from "lucide-react"
import { supabase }                  from "@/lib/supabase"

// =============================================================================
// 📐 타입 정의
// 💡 파이썬 백엔드가 보내주는 JSON 구조를 TypeScript 타입으로 미리 그려놔요.
//    마치 '택배 상자의 내용물 목록'을 먼저 작성해두는 것과 같아요!
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
// 💡 같은 티커는 항상 같은 색이 나와요 — 마치 회사 로고 색처럼요!
// =============================================================================

const PALETTE = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#f97316"]

function tickerToColor(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

// =============================================================================
// 📈 [B] Recharts 영역 차트 — 동적 임포트 (SSR 비활성화)
// 💡 Recharts는 브라우저 환경에서만 동작해요.
//    서버(Node.js)에서 렌더링하면 에러가 나기 때문에 dynamic()으로 늦게 불러와요.
//    마치 '무거운 악기는 공연 시작 직전에만 꺼낸다'는 것과 같아요!
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
              {/* 위는 색이 진하고 아래로 갈수록 투명해지는 그라데이션 */}
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
              labelFormatter={(label: string) => label}   /* 💡 KST 시간 레이블 표시 */
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
// ⏳ 로딩 스켈레톤 — 데이터를 기다리는 동안 보여줘요
// 💡 마치 '자리 표시용 빈 그릇'처럼, 실제 음식(데이터)이 오기 전에 자리를 잡아줘요!
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

// 💡 인트라데이(분봉/시봉) 탭은 별도 API 호출이 필요해요.
//    해당 탭 → interval 파라미터 매핑
const INTRADAY_INTERVAL: Partial<Record<Period, string>> = {
  "5분":   "5m",
  "15분":  "15m",
  "1시간": "1h",
}

// 💡 일봉 탭은 기존 1년치 데이터에서 슬라이싱만 해요 (추가 API 호출 없음)
const DAILY_SLICE: Partial<Record<Period, number>> = {
  "1일":  5,    // 최근 5 거래일
  "1주":  7,
  "1달":  22,   // 약 22 거래일
  "1년":  9999, // 전체
}

// =============================================================================
// 🏠 메인 페이지 컴포넌트
// =============================================================================

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const router     = useRouter()

  // ── UI 상태 ────────────────────────────────────────────────────────────────
  const [liked,  setLiked]  = useState(false)
  const [period, setPeriod] = useState<Period>("1년")

  // ── 프로필 데이터 상태 (최초 1회 로드) ─────────────────────────────────────
  const [data,      setData]      = useState<StockApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [krName,    setKrName]    = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  // ── 차트 전용 상태 (기간 변경 시 별도 로드) ─────────────────────────────────
  // 💡 기간 탭을 바꿀 때 프로필 전체를 다시 불러오면 화면이 깜빡여요.
  //    차트 데이터만 따로 관리해서, 탭 전환 시 차트만 부드럽게 교체해요.
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
  // 💡 이 useEffect가 '기간 선택에 따라 차트 식재료를 바꾸는' 과정이에요.
  //    • 인트라데이(5분/15분/1시간): 야후 파이낸스에서 새로 가져와요
  //    • 일봉(1일/1주/1달/1년):      이미 받은 1년치 데이터에서 잘라서 써요
  const updateChart = useCallback(async (p: Period, rawData: StockApiResponse | null) => {
    if (!rawData) return

    const intradayInterval = INTRADAY_INTERVAL[p]

    if (intradayInterval) {
      // ── 인트라데이: 별도 차트 API 호출 ───────────────────────────────────
      // 💡 /api/stock/[ticker]/chart?interval=5m 호출 → KST 시간 레이블 반환
      setChartLoading(true)
      try {
        const res  = await fetch(`/api/stock/${encodeURIComponent(ticker)}/chart?interval=${intradayInterval}`)
        const json = await res.json()
        if (!json.error) {
          setChartPoints(json.chart_data.map((pt: { date: string; close: number }) => ({
            time:  pt.date,   // 이미 "HH:MM" KST 형식으로 변환되어 있어요
            price: pt.close,
          })))
        }
      } catch {
        // 실패해도 기존 차트 유지
      } finally {
        setChartLoading(false)
      }

    } else {
      // ── 일봉: 기존 1년치 데이터에서 슬라이싱 ───────────────────────────
      // 💡 마치 '1년치 일기장에서 최근 N페이지만 펼치는' 것과 같아요.
      const sliceCount = DAILY_SLICE[p] ?? 9999
      setChartPoints(
        rawData.chart_data.slice(-sliceCount).map((pt) => {
          // "2025-03-12" → "3/12" 형식으로 변환 (KST 기준 날짜예요)
          const [, mo, d] = pt.date.split("-")
          return { time: `${parseInt(mo)}/${parseInt(d)}`, price: pt.close }
        })
      )
    }
  }, [ticker])

  // data 로드 완료 또는 period 변경 시 차트 갱신
  useEffect(() => {
    updateChart(period, data)
  }, [period, data, updateChart])

  // ── 로딩/에러 처리 ─────────────────────────────────────────────────────────
  if (isLoading)          return <LoadingSkeleton />
  if (error || !data)     return <ErrorCard ticker={ticker.toUpperCase()} message={error ?? "알 수 없는 오류"} onBack={() => router.back()} />

  // =============================================================================
  // 💡 여기서부터가 '반찬통을 열어 그릇에 담는 과정'이에요!
  //    백엔드(data)에서 꺼낸 값들을 화면 변수에 하나씩 배치해요.
  // =============================================================================

  const p          = data.profile                          // 편의를 위해 profile을 p로 줄여요
  const chartRaw   = data.chart_data                       // [{ date, close }, ...]
  const isUp       = p.change_rate >= 0                    // 상승 여부
  const upColor    = isUp ? "#f43f5e" : "#3b82f6"          // 한국 관례: 상승=빨강, 하락=파랑
  const logoColor  = tickerToColor(ticker)                 // 티커 기반 로고 색
  const displayName = krName ?? p.name
  const initial    = (displayName || ticker)[0].toUpperCase()  // 로고 이니셜

  // Clearbit 로고 URL (website 도메인 기반)
  const logoUrl = (() => {
    if (!p.website || logoError) return null
    try {
      const raw = p.website.startsWith("http") ? p.website : `https://${p.website}`
      const domain = new URL(raw).hostname
      return `https://logo.clearbit.com/${domain}`
    } catch { return null }
  })()

  // 💡 현재가 포맷: USD면 달러 기호, KRW면 원 단위로 표시해요
  const priceDisplay = p.currency === "KRW"
    ? `${Math.round(p.current_price ?? 0).toLocaleString()}원`
    : `$${(p.current_price ?? 0).toFixed(2)}`

  // 💡 등락금액 포맷
  const changeDisplay = p.currency === "KRW"
    ? `${Math.abs(Math.round(p.change_amount)).toLocaleString()}원`
    : `$${Math.abs(p.change_amount).toFixed(2)}`

  // 💡 거래소 이름을 한국어로 친절하게 바꿔줘요
  const marketLabel = p.currency === "KRW" ? "한국" : "미국"

  // 💡 chartPoints는 useEffect에서 관리돼요 (인트라데이/일봉 모두 포함)

  // ── 주요 지표 타일 데이터 ────────────────────────────────────────────────
  // 💡 profile에서 꺼낸 포맷팅된 값들을 타일 그리드에 배치해요.
  //    각 stat은 { label(이름), value(숫자), hint(초보 설명) } 구조예요.
  const stats = [
    { label: "시가총액",   value: p.market_cap_fmt,       hint: "이 회사 전체의 가격이에요" },
    { label: "PER",        value: p.per_fmt,              hint: "주가 ÷ 이익, 낮을수록 싸요" },
    { label: "배당수익률", value: p.dividend_yield_fmt,   hint: "1년에 받는 배당금 비율이에요" },
    { label: "52주 최고",  value: p["52w_high_fmt"],      hint: "최근 1년 중 가장 비쌌던 가격" },
    { label: "52주 최저",  value: p["52w_low_fmt"],       hint: "최근 1년 중 가장 쌌던 가격" },
    { label: "거래량",     value: p.volume_fmt,           hint: "오늘 사고판 주식의 수예요" },
  ]

  // 공통 카드 스타일
  const cardCls   = "bg-white rounded-[24px] p-6"
  const shadowStyle = { boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }

  // =============================================================================
  // 🖥️ 실제 렌더링 시작
  // =============================================================================

  return (
    <div className="min-h-dvh bg-[#F2F4F8]">

      {/* ════════════════════════════════════════════════════════════════════
          [A] 헤더 — 뒤로가기 + 종목명 + 찜하기
      ════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
        <div className="max-w-md mx-auto px-4 h-[56px] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          {/* 💡 한국 종목이면 krName(한국어), 아니면 p.name(영문) 표시 */}
          <div className="text-center">
            <p className="text-[16px] font-black text-slate-900 leading-tight">{displayName}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{data.ticker} · {marketLabel} 상장</p>
          </div>

          <button
            type="button"
            onClick={() => setLiked(v => !v)}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? "fill-rose-400 text-rose-400" : "text-slate-300"}`} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-4">

        {/* ════════════════════════════════════════════════════════════════════
            [A+B] 가격 정보 + 차트 카드
            💡 이 카드가 '거실'이에요 — 가장 중요한 숫자와 그래프가 모여있어요.
               data.profile에서 꺼낸 current_price, change_rate, change_amount가
               여기서 화면에 그려져요!
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>

          {/* 로고 배지 + 종목명 */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-[18px] overflow-hidden shrink-0 shadow-md flex items-center justify-center bg-white">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="w-10 h-10 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-black text-[18px]"
                  style={{ backgroundColor: logoColor }}
                >
                  {initial}
                </div>
              )}
            </div>
            <div>
              <p className="text-[22px] font-black text-slate-900 leading-tight">{displayName}</p>
              <p className="text-[11px] font-bold text-slate-400">{data.ticker} · {p.exchange}</p>
            </div>
          </div>

          {/* 💡 priceDisplay: p.current_price를 통화에 맞게 포맷한 값이에요 */}
          <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight">{priceDisplay}</p>

          {/* 등락률 뱃지 */}
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-black ${
              isUp
                ? "bg-rose-50 text-rose-500 border border-rose-200"    // 상승 = 빨강
                : "bg-blue-50 text-blue-500 border border-blue-200"    // 하락 = 파랑
            }`}>
              {/* 💡 p.change_rate: 백엔드가 계산해준 등락률 (%)이에요 */}
              {isUp ? "▲" : "▼"} {Math.abs(p.change_rate).toFixed(2)}%
            </span>
            <span className={`text-[13px] font-bold ${isUp ? "text-rose-400" : "text-blue-400"}`}>
              {isUp ? "+" : "-"}{changeDisplay}
            </span>
            <span className="text-[11px] font-bold text-slate-300 ml-auto">전일 대비</span>
          </div>

          {/* [B] 기간 선택 버튼 — 가로 스크롤 지원 */}
          {/* 💡 버튼이 많아서 작은 화면에서도 가로로 스크롤해서 볼 수 있어요 */}
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

          {/* [B] 차트 — chartPoints 상태를 받아서 그려요 */}
          <div className="mt-4 -mx-2 relative">
            {chartLoading ? (
              // 💡 인트라데이 전환 중: 차트 자리에 로딩 애니메이션 표시
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
            💡 p.listing_date, p.industry, p.ceo, p.summary 를 보여줘요.
               모두 백엔드의 profile 객체에서 꺼낸 실제 데이터예요!
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">🏢 회사랑 친해져 볼까요?</h3>

          <div className="space-y-3 mb-4">
            {/* 상장일 — p.listing_date (Python이 타임스탬프 → 날짜 변환해줬어요) */}
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

            {/* 주요 사업 — p.industry */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">주요 사업</p>
                <p className="text-[13px] font-black text-slate-800">{p.industry}</p>
              </div>
            </div>

            {/* CEO — p.ceo */}
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

          {/* 회사 설명 — p.summary (영문 원문) */}
          <div className="bg-slate-50 rounded-[16px] px-4 py-3.5">
            <p className="text-[12px] font-bold text-slate-500 leading-relaxed line-clamp-5">
              {p.summary}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            [D] 주요 지표 2×3 타일 그리드
            💡 stats 배열: profile에서 꺼낸 포맷팅된 숫자들이에요.
               각 타일 = 지표이름 + 실제값 + 초보자 설명
        ════════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">📊 건강 상태 체크</h3>

          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-[18px] px-4 py-3.5 space-y-1">
                {/* 지표 이름 */}
                <p className="text-[10px] font-bold text-slate-400">{stat.label}</p>
                {/* 💡 실제 값: profile에서 꺼낸 포맷팅된 문자열 (예: "3.3조", "31.5배") */}
                <p className="text-[16px] font-black text-slate-900 leading-tight">{stat.value}</p>
                {/* 초보자용 힌트 */}
                <p className="text-[9px] font-bold text-slate-400 leading-snug">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 데이터 갱신 시각 (투명하게) */}
        <p className="text-center text-[10px] font-bold text-slate-300">
          데이터 기준: {new Date(data.fetched_at).toLocaleString("ko-KR")}
        </p>

      </main>


    </div>
  )
}
