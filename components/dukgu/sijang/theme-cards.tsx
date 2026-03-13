"use client"

// =============================================================================
// 주제따라 탐색하기 - 테마 카드 그리드
// =============================================================================

import { useState } from "react"

// ─── 테마 데이터 ──────────────────────────────────────────────────────────────

interface Theme {
  emoji: string
  name: string
  desc: string
  count: number
  tickers: string[]
}

const KR_THEMES: Theme[] = [
  { emoji: "💾", name: "K-반도체 대장주", desc: "시총 상위 반도체 핵심", count: 4, tickers: ["005930", "000660", "000660", "SK하이닉스"] },
  { emoji: "🚗", name: "K-자동차 3인방", desc: "현대·기아·모비스 라인업", count: 3, tickers: ["현대차", "기아", "현대모비스"] },
  { emoji: "🏥", name: "K-바이오 성장주", desc: "글로벌 진출 노리는 바이오", count: 4, tickers: ["셀트리온", "삼성바이오"] },
  { emoji: "📱", name: "K-인터넷 플랫폼", desc: "국내 IT 생태계 핵심", count: 2, tickers: ["NAVER", "카카오"] },
  { emoji: "⚓", name: "조선·방산 수혜주", desc: "글로벌 발주 증가 수혜", count: 3, tickers: ["HD한국조선해양", "한화오션"] },
  { emoji: "🏦", name: "고배당 금융주", desc: "안정적 배당 + 주가 방어", count: 4, tickers: ["KB금융", "신한지주"] },
]

const US_THEMES: Theme[] = [
  { emoji: "🤖", name: "AI·반도체 핵심주", desc: "엔비디아가 이끄는 AI 물결", count: 5, tickers: ["NVDA", "AMD", "AVGO"] },
  { emoji: "📊", name: "S&P500 대표주", desc: "미국 대형주 안정 포트폴리오", count: 10, tickers: ["AAPL", "MSFT", "GOOGL"] },
  { emoji: "💊", name: "헬스케어 성장주", desc: "비만 치료제 + 노령화 수혜", count: 5, tickers: ["LLY", "JNJ", "ABBV"] },
  { emoji: "⚡", name: "전기차 & 미래차", desc: "EV 전환의 최전선", count: 3, tickers: ["TSLA", "RIVN", "GM"] },
  { emoji: "🏦", name: "미국 대형 금융주", desc: "금리 환경 수혜 금융사", count: 4, tickers: ["JPM", "BAC", "V"] },
  { emoji: "🛒", name: "소비재 & 이커머스", desc: "경기 사이클 선도 기업", count: 4, tickers: ["AMZN", "COST", "WMT"] },
]

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function ThemeCards() {
  const [market, setMarket] = useState<"kr" | "us">("kr")
  const themes = market === "kr" ? KR_THEMES : US_THEMES

  return (
    <section className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.05)] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-black text-slate-900">주제따라 탐색하기</h3>
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

      {/* 2열 그리드 */}
      <div className="grid grid-cols-2 gap-2.5">
        {themes.map((theme) => (
          <button
            key={theme.name}
            className="text-left bg-slate-50 rounded-2xl p-3.5 border border-slate-100 active:scale-[0.97] transition-all"
          >
            <div className="text-[22px] mb-2">{theme.emoji}</div>
            <p className="text-[13px] font-black text-slate-900 leading-tight mb-1">{theme.name}</p>
            <p className="text-[10px] font-bold text-slate-400 leading-snug mb-2.5">{theme.desc}</p>
            <p className="text-[10px] font-black text-emerald-500">{theme.count}개 종목 →</p>
          </button>
        ))}
      </div>
    </section>
  )
}
