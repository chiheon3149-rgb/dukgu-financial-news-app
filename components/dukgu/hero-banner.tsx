import { Sparkles, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

const WON_DOLLAR = "\uC6D0/\uB2EC\uB7EC 1,340"

export function HeroBanner() {
  return (
    <section className="px-4 pt-4 pb-2 max-w-lg mx-auto">
      <button className="w-full group" aria-label={"\uC624\uB298\uC758 \uBAA8\uB2DD \uBE0C\uB9AC\uD551 \uBCF4\uAE30"}>
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
              {"\uC624\uB298\uC758 \uBAA8\uB2DD \uBE0C\uB9AC\uD551 (7 AM)"}
            </h2>
            <p className="text-sm text-primary-foreground/80 text-left mb-4 leading-relaxed">
              {"\uCF54\uC2A4\uD53C \uC0C1\uC2B9 \uCD9C\uBC1C, \uBBF8\uAD6D \uAE08\uB9AC \uC778\uD558 \uAE30\uB300\uAC10 \uD655\uC0B0"}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs bg-primary-foreground/10 rounded-full px-2 py-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">KOSPI 2,680</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-primary-foreground/10 rounded-full px-2 py-1">
                  <TrendingDown className="w-3 h-3" />
                  <span className="font-medium">{WON_DOLLAR}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary-foreground/90 group-hover:translate-x-0.5 transition-transform">
                <span>{"\uC77D\uAE30"}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </section>
  )
}
