"use client"

import { Sparkles, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

export function HeroBanner() {
  return (
    <section className="px-4 pt-4 pb-2 max-w-lg mx-auto">
      <button className="w-full group" aria-label="오늘의 모닝 브리핑 보기">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-6 -translate-x-6" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-2.5 py-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">TODAY</span>
              </div>
              <span className="text-xs text-primary-foreground/70">2026.02.20</span>
            </div>

            <h2 className="text-lg font-bold text-left mb-1.5 leading-snug text-balance">
              {"오늘의 모닝 브리핑 (7 AM)"}
            </h2>
            <p className="text-sm text-primary-foreground/80 text-left mb-4 leading-relaxed">
              {"코스피 상승 출발, 미국 금리 인하 기대감 확산"}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs bg-primary-foreground/10 rounded-full px-2 py-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">KOSPI 2,680</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-primary-foreground/10 rounded-full px-2 py-1">
                  <TrendingDown className="w-3 h-3" />
                  <span className="font-medium">원/달러 1,340</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary-foreground/90 group-hover:translate-x-0.5 transition-transform">
                <span>읽기</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </section>
  )
}
