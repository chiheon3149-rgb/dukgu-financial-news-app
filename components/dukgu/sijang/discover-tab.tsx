"use client"

// =============================================================================
// 🌍 [발견] 탭 - 시장 둘러보기
//
// 💡 이 컴포넌트는 '오늘 세계 주식 시장은 어떤가요?' 를 한눈에 보여줘요.
//    뉴스처럼 시장 상황을 요약해주는 게시판 같은 역할이에요!
// =============================================================================

import Link from "next/link"
import { TrendingUp, TrendingDown, Flame, ChevronRight } from "lucide-react"
import { MOCK_INDICES, MOCK_TOP_GAINERS } from "@/lib/mock/market"

export function DiscoverTab() {
  return (
    <div className="space-y-5">

      {/* ─── 시장 지수 그리드 ───────────────────────────────────────────── */}
      {/* 💡 코스피, 나스닥 같은 시장 전체 온도를 미니 카드로 보여줘요 */}
      <section>
        <h3 className="text-[13px] font-black text-slate-700 mb-3 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-emerald-500 rounded-full" />
          글로벌 시장 지수
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {MOCK_INDICES.map((idx) => {
            const isUp = idx.positive
            return (
              <div
                key={idx.name}
                className={`rounded-[20px] p-4 border ${
                  isUp
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-rose-50 border-rose-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-black text-slate-700">{idx.name}</p>
                  {isUp
                    ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-rose-500"   />
                  }
                </div>
                <p className="text-[18px] font-black text-slate-900 leading-tight">
                  {idx.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
                <span className={`text-[11px] font-black mt-1 inline-block px-2 py-0.5 rounded-full ${
                  isUp ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}>
                  {isUp ? "▲" : "▼"} {Math.abs(idx.changeRate).toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── 오늘 훌쩍 뛴 주식 랭킹 ────────────────────────────────────── */}
      {/* 💡 오늘 가격이 많이 오른 주식 TOP3를 순위 카드로 보여줘요 */}
      <section>
        <h3 className="text-[13px] font-black text-slate-700 mb-3 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-400" />
          오늘 훌쩍 뛴 주식 🔥
        </h3>
        <div className="space-y-2.5">
          {MOCK_TOP_GAINERS.map((stock) => {
            // 메달 색상: 금·은·동
            const medalColors = ["#F59E0B", "#94A3B8", "#CD7C2F"]
            const medalBgs    = ["bg-amber-50 border-amber-200", "bg-slate-50 border-slate-200", "bg-orange-50 border-orange-200"]

            return (
              <Link
                key={stock.ticker}
                href={`/assets/stock/${stock.ticker}`}
                className={`flex items-center gap-4 bg-white rounded-[20px] px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border ${medalBgs[stock.rank - 1] || "border-transparent"} active:scale-[0.98] transition-all group`}
              >
                {/* 순위 번호 */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[14px] shrink-0"
                  style={{ color: medalColors[stock.rank - 1] ?? "#64748b" }}
                >
                  {stock.rank}
                </div>

                {/* 로고 배지 */}
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white font-black text-[13px] shrink-0"
                  style={{ backgroundColor: stock.color }}
                >
                  {stock.initial}
                </div>

                {/* 종목 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-slate-900">{stock.name}</p>
                  {/* 💡 급등 이유를 짧게 설명해줘요 (초보자 친화적!) */}
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{stock.reason}</p>
                </div>

                {/* 등락률 */}
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[14px] font-black text-emerald-600">
                    ▲{stock.changeRate.toFixed(2)}%
                  </span>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {stock.currency === "USD" ? `$${stock.currentPrice}` : `${stock.currentPrice.toLocaleString()}원`}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-400 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* ─── 오늘의 한 줄 팁 ────────────────────────────────────────────── */}
      {/* 💡 주식 초보자를 위한 짧은 경제 상식 카드예요 */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[24px] p-5 border border-emerald-100">
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">오늘의 경제 한 줄 팁 💡</p>
        <p className="text-[13px] font-black text-slate-800 leading-relaxed">
          "주가가 오른다는 건, 더 많은 사람들이 그 회사의 미래를 믿는다는 신호예요!"
        </p>
      </section>
    </div>
  )
}
