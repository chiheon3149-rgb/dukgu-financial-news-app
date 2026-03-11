"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface QuoteResult {
  ticker: string
  name?: string
  currentPrice: number
  change?: number
  changePercent: number
}

function getSentiment(vix: number) {
  if (vix < 15) {
    return {
      icon: "☀️",
      label: "시장이 맑아요",
      color: "#10B981",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    }
  } else if (vix < 20) {
    return {
      icon: "⛅",
      label: "구름이 조금 있어요",
      color: "#F59E0B",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    }
  } else if (vix < 25) {
    return {
      icon: "🌧️",
      label: "비가 올 것 같아요",
      color: "#F97316",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    }
  } else if (vix < 40) {
    return {
      icon: "⚡",
      label: "폭풍 주의보예요",
      color: "#EF4444",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
    }
  } else {
    return {
      icon: "🌪️",
      label: "태풍급 패닉이에요",
      color: "#7C3AED",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    }
  }
}

function useCountingAnimation(target: number, duration = 600) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = prevRef.current
    if (from === target) return

    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (target - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        prevRef.current = target
        setDisplay(target)
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

export function MarketSentimentCard() {
  const [vix, setVix] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const animatedVix = useCountingAnimation(vix ?? 0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market/quotes?tickers=^VIX")
        if (!res.ok) return
        const data: QuoteResult[] = await res.json()
        if (data?.[0]?.currentPrice) {
          setVix(data[0].currentPrice)
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // 5분 (서버 캐시 2분과 맞춤)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-[20px] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-100 shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-20 rounded bg-gray-100 shimmer" />
            <div className="h-4 w-28 rounded bg-gray-100 shimmer" />
          </div>
          <div className="space-y-1.5 items-end flex flex-col">
            <div className="h-2.5 w-8 rounded bg-gray-100 shimmer" />
            <div className="h-6 w-14 rounded bg-gray-100 shimmer" />
          </div>
        </div>
      </div>
    )
  }

  if (vix === null) return null

  const sentiment = getSentiment(vix)

  return (
    <div className={`rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden border ${sentiment.borderColor}`}>
      <div className="p-4">
        {/* 메인 행 */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${sentiment.bgColor} flex items-center justify-center text-[22px] shrink-0`}>
            {sentiment.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-medium leading-none mb-1">오늘 시장 분위기</p>
            <p className="text-[16px] font-bold leading-tight" style={{ color: sentiment.color }}>
              {sentiment.label}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">VIX</p>
            <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: sentiment.color }}>
              {animatedVix.toFixed(1)}
            </p>
          </div>
        </div>

        {/* 설명 펼침 버튼 */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 active:scale-95 transition-all duration-150"
        >
          <span>이게 무슨 뜻이야?</span>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* 설명 패널 */}
      {expanded && (
        <div className={`px-4 pb-4 border-t ${sentiment.borderColor}`}>
          <div className={`mt-3 rounded-2xl ${sentiment.bgColor} p-3.5 space-y-2.5`}>
            <p className="text-[13px] font-semibold text-gray-700">
              VIX는 주식시장의 날씨 예보 같은 거야! 🌤️
            </p>
            <div className="space-y-2 text-[12px] text-gray-500">
              <div className="flex items-start gap-2">
                <span className="shrink-0">☀️</span>
                <div>
                  <span className="font-semibold text-emerald-600">맑음 (~15)</span>
                  <span className="text-gray-400"> · 매우 안정적으로, 상승장에 자주 나타나</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0">⛅</span>
                <div>
                  <span className="font-semibold text-amber-500">구름 (15~20)</span>
                  <span className="text-gray-400"> · 약간의 변동성, 경계하지만 공포는 없어</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0">🌧️</span>
                <div>
                  <span className="font-semibold text-orange-500">비 (20~25)</span>
                  <span className="text-gray-400"> · 투자자 긴장 시작, 변동성 확대, 조정 가능성 있어</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0">⚡</span>
                <div>
                  <span className="font-semibold text-red-500">폭풍 (25~40)</span>
                  <span className="text-gray-400"> · 시장 불안 심화, 큰 하락 가능성 있어</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0">🌪️</span>
                <div>
                  <span className="font-semibold text-purple-600">태풍 (40+)</span>
                  <span className="text-gray-400"> · 금융위기급 패닉! 코로나 쇼크, 금융위기 때 나타났어</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
