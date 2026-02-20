"use client"

import { CheckCircle2, Quote } from "lucide-react"

interface BriefingSummaryProps {
  summary: string;
  quote: string;
  author: string;
}

export function BriefingSummary({ summary, quote, author }: BriefingSummaryProps) {
  return (
    <section className="bg-slate-900 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden transition-all hover:shadow-emerald-500/10">
      {/* 💡 장식용 은은한 빛 효과 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
      
      <h3 className="flex items-center gap-2 font-bold text-lg text-white mb-4 border-b border-white/10 pb-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Executive Summary
      </h3>
      
      <p className="text-sm text-slate-300 leading-relaxed mb-8 italic">
        "{summary}"
      </p>
      
      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 relative group transition-all hover:bg-white/10">
        <Quote className="w-6 h-6 text-emerald-400 mb-2 opacity-50 transition-transform group-hover:scale-110" />
        <p className="text-sm font-bold text-white leading-relaxed">
          "{quote}"
        </p>
        <p className="text-right text-[10px] text-slate-400 mt-2 font-medium tracking-tight">
          — {author}
        </p>
      </div>
    </section>
  )
}