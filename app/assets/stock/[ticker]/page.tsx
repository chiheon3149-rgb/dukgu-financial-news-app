"use client"

// =============================================================================
// 📊 주식 상세 페이지 — 전면 개편 버전
//
// [A] 헤더 + 핵심 가격 정보
// [B] 부드러운 영역형 차트 + 기간 선택
// [C] 회사랑 친해지기 카드
// [D] 주요 지표 2×3 타일 그리드
// [E] 최신 뉴스 리스트
// [F] 하단 고정 매수/매도 버튼
// =============================================================================

import { useState, use } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Building2, Briefcase, User2, Newspaper } from "lucide-react"
import { MOCK_STOCK_DETAILS, MOCK_STOCK_DEFAULT } from "@/lib/mock/market"

// ─── [B] 차트 컴포넌트 ────────────────────────────────────────────────────────
// 💡 Recharts는 브라우저에서만 동작하기 때문에 dynamic import를 써요.
//    마치 '무거운 악기는 공연 시작 직전에만 꺼낸다'는 것과 같아요!
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
              {/* 💡 그라데이션: 위는 색이 진하고 아래로 갈수록 투명해져요 */}
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={upColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={upColor} stopOpacity={0}    />
              </linearGradient>
            </defs>
            {/* X/Y축 숫자와 눈금선을 모두 숨겨 극도로 깔끔하게 만들어요 */}
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "none",
                borderRadius: "14px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 900,
                color: upColor,
              }}
              formatter={(v: number) => [v.toLocaleString(), ""]}
              labelFormatter={() => ""}
              cursor={{ stroke: upColor, strokeWidth: 1.5, strokeDasharray: "4 4" }}
            />
            {/* type="monotone"이 선을 부드러운 곡선으로 만들어줘요 */}
            <Area
              type="monotone"
              dataKey="price"
              stroke={upColor}
              strokeWidth={2.8}
              fill="url(#areaGrad)"
              dot={false}
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
      // 로딩 중 스켈레톤 — 마치 빈 악보처럼 자리만 잡아줘요
      <div className="w-full h-[220px] flex items-end gap-1 px-2 pb-2">
        {[35,55,40,68,50,78,62,88,72,82,68,92,76,84].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t-md animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  }
)

const PERIODS = ["1일", "1주", "1달", "1년"] as const
type Period = typeof PERIODS[number]

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const router = useRouter()

  const [liked,  setLiked]  = useState(false)
  const [period, setPeriod] = useState<Period>("1일")

  // 💡 URL의 티커로 종목 데이터를 찾아요. 없으면 기본값을 보여줘요.
  const stock = MOCK_STOCK_DETAILS[ticker.toUpperCase()] ?? { ...MOCK_STOCK_DEFAULT, ticker, name: ticker }

  // 한국 증시 관례: 상승=빨강, 하락=파랑
  const isUp     = stock.changeRate >= 0
  const upColor  = isUp ? "#f43f5e" : "#3b82f6"   // rose-500 or blue-500

  const priceDisplay  = stock.currency === "USD" ? `$${stock.currentPrice.toFixed(2)}`  : `${stock.currentPrice.toLocaleString()}원`
  const changeDisplay = stock.currency === "USD" ? `$${Math.abs(stock.changeAmount).toFixed(2)}` : `${Math.abs(stock.changeAmount).toLocaleString()}원`
  const chartData = stock.chartData[period] ?? stock.chartData["1일"]

  // ── 공통 카드 스타일 (말랑말랑 + 부드러운 그림자)
  const cardCls = "bg-white rounded-[24px] p-6"
  const shadowStyle = { boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px" }

  return (
    // 💡 이 div는 페이지 전체를 감싸는 '집' 역할이에요
    <div className="min-h-dvh bg-[#F2F4F8]">

      {/* ══════════════════════════════════════════════════════════════════════
          [A] 헤더 — 뒤로가기 + 찜하기
          💡 이 헤더는 집의 '현관문' 같은 역할이에요 — 항상 위에 붙어있어요
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
        <div className="max-w-md mx-auto px-4 h-[56px] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          {/* 중앙: 종목명 + 티커 */}
          <div className="text-center">
            <p className="text-[16px] font-black text-slate-900 leading-tight">{stock.name}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{stock.ticker} · {stock.market}</p>
          </div>

          {/* 💡 하트 버튼 — 누르면 빨갛게 채워지며 관심 종목에 추가돼요 */}
          <button
            type="button"
            onClick={() => setLiked(v => !v)}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
          >
            <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? "fill-rose-400 text-rose-400" : "text-slate-300"}`} />
          </button>
        </div>
      </header>

      {/* ── 본문 스크롤 영역 ────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 pt-4 pb-36 space-y-4">

        {/* ══════════════════════════════════════════════════════════════════
            [A] 핵심 가격 정보 + [B] 차트 — 한 카드에 모아서 임팩트 있게!
            💡 이 카드는 집의 '거실' — 가장 중요한 정보가 모여있는 공간이에요
        ══════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>

          {/* 로고 배지 + 종목명 */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white font-black text-[18px] shrink-0 shadow-md"
              style={{ backgroundColor: stock.color }}
            >
              {stock.initial}
            </div>
            <div>
              <p className="text-[22px] font-black text-slate-900 leading-tight">{stock.name}</p>
              <p className="text-[11px] font-bold text-slate-400">{stock.ticker} · {stock.market === "KR" ? "한국" : "미국"} 상장</p>
            </div>
          </div>

          {/* 현재가 */}
          <p className="text-[38px] font-black text-slate-900 leading-none tracking-tight">{priceDisplay}</p>

          {/* 등락률 뱃지 (알약 모양) */}
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-black ${
              isUp
                ? "bg-rose-50 text-rose-500 border border-rose-200"     // 상승=따뜻한 빨강 (한국 관례)
                : "bg-blue-50 text-blue-500 border border-blue-200"     // 하락=시원한 파랑
            }`}>
              {isUp ? "▲" : "▼"} {Math.abs(stock.changeRate).toFixed(2)}%
            </span>
            <span className={`text-[13px] font-bold ${isUp ? "text-rose-400" : "text-blue-400"}`}>
              {isUp ? "+" : "-"}{changeDisplay}
            </span>
            <span className="text-[11px] font-bold text-slate-300 ml-auto">전일 대비</span>
          </div>

          {/* [B] 차트 영역 */}
          <div className="mt-6 -mx-2">
            <StockAreaChart data={chartData} upColor={upColor} />
          </div>

          {/* [B] 기간 선택 토글 버튼 그룹 */}
          {/* 💡 이 버튼들은 '리모컨'처럼 — 누르면 해당 기간의 차트로 바뀌어요 */}
          <div className="mt-4 bg-slate-50 rounded-[16px] p-1 flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 rounded-[12px] text-[12px] font-black transition-all duration-200 active:scale-95 ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            [C] 회사랑 친해지기 카드
            💡 이 카드는 '회사 명함' 같은 역할이에요 — 한눈에 회사를 파악해요!
        ══════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">🏢 회사랑 친해져 볼까요?</h3>

          {/* 아이콘 + 텍스트 리스트 */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">상장일</p>
                <p className="text-[13px] font-black text-slate-800">{stock.companyInfo.listingDate} <span className="text-slate-400 font-bold">(아주 오랜 전통!)</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">주요 사업</p>
                <p className="text-[13px] font-black text-slate-800">{stock.companyInfo.mainBusiness} <span className="text-slate-400 font-bold">(우리가 매일 쓰는 것들)</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-violet-50 flex items-center justify-center shrink-0">
                <User2 className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">CEO (대표이사)</p>
                <p className="text-[13px] font-black text-slate-800">{stock.companyInfo.ceo}</p>
              </div>
            </div>
          </div>

          {/* 회사 설명 — 연한 배경 박스에 담아요 */}
          {/* 💡 이 박스는 '회사 소개 팜플렛' 같은 역할이에요 */}
          <div className="bg-slate-50 rounded-[16px] px-4 py-3.5">
            <p className="text-[13px] font-bold text-slate-600 leading-relaxed">{stock.description}</p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            [D] 주요 지표 2×3 타일 그리드
            💡 이 타일들은 회사의 '건강검진 결과지' 같은 역할이에요.
               6개의 숫자로 회사의 상태를 한눈에 체크할 수 있어요!
        ══════════════════════════════════════════════════════════════════ */}
        <section className={cardCls} style={shadowStyle}>
          <h3 className="text-[13px] font-black text-slate-500 mb-4">📊 건강 상태 체크</h3>

          {/* 2열 3행 바둑판 배열 */}
          <div className="grid grid-cols-2 gap-2.5">
            {stock.stats.map((stat) => (
              // 💡 각 타일은 '작은 명함' — 지표 이름, 숫자, 설명이 위아래로 들어가요
              <div
                key={stat.label}
                className="bg-slate-50 rounded-[18px] px-4 py-3.5 space-y-1"
              >
                {/* 상단: 지표 이름 */}
                <p className="text-[10px] font-bold text-slate-400">{stat.label}</p>
                {/* 중단: 실제 숫자 (크고 굵게) */}
                <p className="text-[16px] font-black text-slate-900 leading-tight">{stat.value}</p>
                {/* 하단: 초보자용 설명 */}
                <p className="text-[9px] font-bold text-slate-400 leading-snug">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            [E] 최신 뉴스 리스트
            💡 이 섹션은 '실시간 뉴스 게시판' 같은 역할이에요.
               이 회사와 관련된 따끈따끈한 소식들이에요!
        ══════════════════════════════════════════════════════════════════ */}
        {stock.news.length > 0 && (
          <section className={cardCls} style={shadowStyle}>
            <h3 className="text-[13px] font-black text-slate-500 mb-4 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-slate-400" />
              방금 들어온 소식
            </h3>

            <div className="space-y-3">
              {stock.news.map((item, idx) => (
                // 💡 각 뉴스 줄은 '신문 한 줄' 같은 역할이에요
                <div
                  key={idx}
                  className={`flex items-center gap-3 ${idx < stock.news.length - 1 ? "pb-3 border-b border-slate-50" : ""}`}
                >
                  {/* 뉴스 제목 + 시간 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2">{item.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{item.timeAgo}</p>
                  </div>

                  {/* 썸네일 이미지 자리 (실제 이미지 없을 때 예쁜 placeholder) */}
                  <div
                    className="w-16 h-16 rounded-[14px] shrink-0 flex items-center justify-center text-2xl"
                    style={{ backgroundColor: stock.color + "22" }}
                  >
                    <span style={{ filter: "grayscale(0.3)" }}>{stock.initial}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          [F] 하단 고정 매수/매도 버튼 (Sticky Footer)
          💡 이 버튼들은 '가게 계산대' 같은 역할이에요.
             스크롤을 아무리 내려도 항상 화면 맨 아래에 붙어있어요!
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 pointer-events-none">
        <div
          className="max-w-md mx-auto px-4 py-3 pointer-events-auto"
          style={{ background: "linear-gradient(to top, rgba(242,244,248,1) 70%, rgba(242,244,248,0))" }}
        >
          <div className="flex gap-3">
            {/* 구매하기 — 따뜻한 코랄/빨강 */}
            <button
              type="button"
              className="flex-1 py-4 rounded-[20px] font-black text-[16px] text-white active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)",
                boxShadow: "0 6px 20px rgba(238,90,90,0.35)",
              }}
            >
              구매하기
            </button>

            {/* 판매하기 — 시원한 스카이블루 */}
            <button
              type="button"
              className="flex-1 py-4 rounded-[20px] font-black text-[16px] text-white active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                boxShadow: "0 6px 20px rgba(59,130,246,0.30)",
              }}
            >
              판매하기
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
