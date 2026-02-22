"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, Plus, Loader2 } from "lucide-react"
import type { StockHolding } from "@/types"

// =============================================================================
// 🔍 AddTickerSheet — 티커 검색 & 추가 바텀시트
//
// 작동 방식:
// 유저가 검색어를 입력하면 Yahoo Finance의 search API를 통해
// 실제 티커 목록을 가져옵니다. 이름 또는 티커 심볼로 검색 가능합니다.
// 결과에서 원하는 종목을 탭하면 onAdd 콜백이 호출됩니다.
//
// CORS 우회 방법: Yahoo Finance search는 서버 프록시 없이도 동작하지만
// 불안정할 경우 /api/market/search 라우트를 추가해 같은 패턴으로 감싸면 됩니다.
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

export function AddTickerSheet({ isOpen, onClose, onAdd }: AddTickerSheetProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시트가 열릴 때 인풋에 자동 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setQuery("")
      setResults([])
    }
  }, [isOpen])

  // 300ms 디바운스로 API 호출 — 글자 입력마다 요청하지 않도록
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        )
        const data = await res.json()
        const quotes: SearchResult[] = (data?.quotes ?? []).filter(
          (q: any) => q.typeDisp === "Equity" || q.typeDisp === "ETF"
        )
        setResults(quotes)
      } catch {
        setSearchError("검색 중 오류가 발생했습니다. 티커를 직접 입력해 보세요.")
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [query])

  const handleAdd = (result: SearchResult) => {
    // KRW 종목 자동 감지: .KS (코스피), .KQ (코스닥)
    const isKrw = result.symbol.endsWith(".KS") || result.symbol.endsWith(".KQ")
    onAdd({
      ticker: result.symbol,
      name: result.shortname,
      currency: isKrw ? "KRW" : "USD",
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* 시트 본체 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300"
        style={{ maxHeight: "80vh" }}>

        {/* 핸들 + 헤더 */}
        <div className="px-6 pt-5 pb-3">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-black text-slate-900">종목 추가</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 검색 인풋 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="종목명 또는 티커 검색 (예: Apple, AAPL, 삼성)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />}
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="px-3 pb-10 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {searchError && (
            <p className="text-center text-[12px] font-bold text-rose-400 py-6">{searchError}</p>
          )}

          {!isSearching && query && results.length === 0 && !searchError && (
            <p className="text-center text-[12px] font-bold text-slate-300 py-10">
              검색 결과가 없습니다.<br />
              <span className="text-slate-400">정확한 티커(예: AAPL)로 다시 시도해 보세요.</span>
            </p>
          )}

          {results.map((result) => (
            <button
              key={result.symbol}
              onClick={() => handleAdd(result)}
              className="w-full flex items-center justify-between px-3 py-4 rounded-2xl hover:bg-slate-50 active:bg-emerald-50 transition-all group"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black text-slate-800">{result.symbol}</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase">
                    {result.typeDisp}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300">{result.exchDisp}</span>
                </div>
                <p className="text-[12px] font-bold text-slate-500 mt-0.5 truncate max-w-[220px]">
                  {result.shortname}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-500 flex items-center justify-center transition-all">
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </button>
          ))}

          {!query && (
            <div className="py-8 text-center">
              <p className="text-[12px] font-bold text-slate-300">
                티커 또는 회사명을 입력하면<br />실시간으로 검색됩니다
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["AAPL", "NVDA", "005930.KS", "VOO", "QQQ"].map((t) => (
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
        </div>
      </div>
    </>
  )
}
