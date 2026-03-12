"use client"

import { DetailHeader } from "@/components/dukgu/detail-header"
import { MyPortfolioBox } from "@/components/dukgu/my-portfolio-box"
import { AdBanner } from "@/components/dukgu/ad-banner"
import { Wallet } from "lucide-react"

export default function MyPortfolioPage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      <DetailHeader
        showBack
        title={
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900">나의 포트폴리오</span>
          </div>
        }
      />
      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        <MyPortfolioBox />
        <AdBanner />
      </main>
    </div>
  )
}
