"use client"

import { Wallet, PieChart, TrendingUp, ChevronRight, Plus, Landmark, Coins } from "lucide-react"
import Link from "next/link"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AssetTotalCard } from "@/components/dukgu/asset-total-card"
import { AssetAllocationChart } from "@/components/dukgu/asset-allocation-chart"

export default function AssetsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* 🚀 1. 헤더: Root 페이지이므로 showBack={false}를 적용해 뒤로가기를 제거했습니다 */}
      <DetailHeader 
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">내 자산</span>
          </div>
        } 
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-8">
        {/* 🚀 2. 총 자산 섹션 (미니멀 카드) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              자산 요약
            </h2>
          </div>
          <AssetTotalCard />
        </section>

        {/* 🚀 3. 포트폴리오 섹션 (리퀴드 글래스 병렬 차트) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              포트폴리오 비중
            </h2>
          </div>
          <AssetAllocationChart />
        </section>

        {/* 🚀 4. 개별 자산 리스트 (브리핑 카드 스타일) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              개별 자산 현황
            </h2>
            <button className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
              <Plus className="w-3 h-3" /> 자산 추가
            </button>
          </div>

          <div className="grid gap-3">
            {/* 🍎 주식: 클릭 시 주식 상세로 가는 구조 (기획 예정) */}
            <button className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-[15px] font-black text-slate-800">국내/해외 주식</h3>
                  <p className="text-[11px] font-bold text-slate-400">24개 종목 보유 중</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[14px] font-black text-slate-800">255,000,000원</p>
                  <p className="text-[11px] font-bold text-rose-500">+12.4%</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
              </div>
            </button>

            {/* 🏠 부동산: 기획자님의 관심사 반영 */}
            <button className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <Landmark className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-[15px] font-black text-slate-800">부동산/분양권</h3>
                  <p className="text-[11px] font-bold text-slate-400">검단신도시 푸르지오 등</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[14px] font-black text-slate-800">425,000,000원</p>
                  <p className="text-[11px] font-bold text-slate-400">변동없음</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
              </div>
            </button>

            {/* 💰 기타 자산 (금/현금 등) */}
            <button className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:border-amber-200 transition-all group active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-[15px] font-black text-slate-800">기타 자산</h3>
                  <p className="text-[11px] font-bold text-slate-400">금, 현금, 채권 등</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[14px] font-black text-slate-800">170,000,000원</p>
                  <p className="text-[11px] font-bold text-emerald-500">+0.8%</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}