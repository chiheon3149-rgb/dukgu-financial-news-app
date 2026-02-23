"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, Plus, Loader2 } from "lucide-react"
import type { StockHolding } from "@/types"

// =============================================================================
// 🔍 AddTickerSheet — 티커 검색 & 추가 바텀시트
//
// 검색: /api/market/search (서버 프록시) → CORS 우회
// 레이아웃: 결과 영역 고정 높이 유지로 입력 시 layout shift 방지
// =============================================================================

interface SearchResult {
  symbol: string
  shortname: string
  exchDisp: string
  typeDisp: string
}

interface AddTickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (holding: Omit<StockHolding, "trades" | "dividends">) => void
}

const PRESET_TICKERS = ["AAPL", "NVDA", "005930.KS", "VOO", "QQQ"]

export function AddTickerSheet({ isOpen, onClose, onAdd }: AddTickerSheetProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시트가 열릴 때 초기화 + 자동 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setQuery("")
      setResults([])
      setSearchError(null)
    }
  }, [isOpen])

  // 300ms 디바운스 검색 (서버 프록시 사용)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      setSearchError(null)
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (data.error) {
          setSearchError(data.error)
          setResults([])
        } else {
          setResults(data.quotes ?? [])
        }
      } catch {
        setSearchError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [query])

  const handleAdd = (result: SearchResult) => {
    const isKrw = result.symbol.endsWith(".KS") || result.symbol.endsWith(".KQ")
    onAdd({
      ticker: result.symbol,
      name: result.shortname,
      currency: isKrw ? "KRW" : "USD",
    })
    onClose()
  }

  if (!isOpen) return null

  // 결과 영역에 표시할 내용
  const showPreset = !query
  const showEmpty = query && !isSearching && results.length === 0 && !searchError
  const showResults = results.length > 0

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* 시트 본체 — 높이 고정으로 layout shift 방지 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ height: "75dvh" }}
      >
        {/* 헤더 (고정) */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-black text-slate-900">종목 추가</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 검색 인풋 — 고정 높이 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="종목명 또는 티커 (예: Apple, AAPL, 삼성)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none min-w-0"
            />
            {isSearching
              ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
              : query
              ? <button onClick={() => setQuery("")} className="shrink-0">
                  <X className="w-4 h-4 text-slate-300 hover:text-slate-500 transition-colors" />
                </button>
              : null
            }
          </div>
        </div>

        {/* 결과 영역 (스크롤 가능, 상단 고정 → layout shift 없음) */}
        <div className="flex-1 overflow-y-auto px-3 pb-10">
          {/* 에러 */}
          {searchError && (
            <p className="text-center text-[12px] font-bold text-rose-400 py-6 px-4">{searchError}</p>
          )}

          {/* 검색어 없을 때 — 프리셋 */}
          {showPreset && (
            <div className="py-6 text-center">
              <p className="text-[12px] font-bold text-slate-300 mb-4">
                티커 또는 회사명을 입력하면<br />실시간으로 검색됩니다
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {PRESET_TICKERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setQuery(t)}
                    className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 검색 중 스켈레톤 */}
          {isSearching && (
            <div className="space-y-1 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-4 rounded-2xl">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-slate-50 rounded animate-pulse" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* 결과 없음 */}
          {showEmpty && !isSearching && (
            <p className="text-center text-[12px] font-bold text-slate-300 py-10 px-4">
              검색 결과가 없습니다.<br />
              <span className="text-slate-400">정확한 티커(예: AAPL)로 다시 시도해 보세요.</span>
            </p>
          )}

          {/* 검색 결과 */}
          {showResults && !isSearching && (
            <div>
              {results.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleAdd(result)}
                  className="w-full flex items-center justify-between px-3 py-4 rounded-2xl hover:bg-slate-50 active:bg-emerald-50 transition-all group"
                >
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-slate-800">{result.symbol}</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                        {result.typeDisp}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 shrink-0">{result.exchDisp}</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-500 mt-0.5 truncate">
                      {result.shortname}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-500 flex items-center justify-center transition-all shrink-0 ml-3">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
