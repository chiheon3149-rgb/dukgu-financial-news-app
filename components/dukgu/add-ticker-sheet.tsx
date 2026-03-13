"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, Plus, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import type { StockHolding, MarketQuote } from "@/types"

interface SearchResult {
  ticker:    string
  name:      string
  exchange:  string
  isKorean:  boolean
  price?:    number
  changeRate?: number
}

interface AddTickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (holding: Omit<StockHolding, "trades" | "dividends" | "accountId">) => void
}

const PRESET_TICKERS = ["AAPL", "NVDA", "005930.KS", "VOO", "QQQ"]

export function AddTickerSheet({ isOpen, onClose, onAdd }: AddTickerSheetProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시트가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setQuery("")
      setResults([])
      setSearchError(null)
    }
  }, [isOpen])

  // 💡 [핵심 로직] 검색 결과에 실시간 가격표 입히기
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
        // 1단계: 티커/회사명 검색
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()

        if (data.error) {
          setSearchError(data.error)
          setResults([])
          setIsSearching(false)
          return
        }

        const searchItems: SearchResult[] = data.results ?? []

        // 2단계: 실시간 시세 병합
        if (searchItems.length > 0) {
          const tickers = searchItems.map(item => item.ticker).join(",")
          const priceRes = await fetch(`/api/market/quotes?tickers=${tickers}`)
          const prices: MarketQuote[] = await priceRes.json()

          const mergedResults = searchItems.map(item => {
            const priceInfo = prices.find(p => p.ticker === item.ticker)
            return { ...item, price: priceInfo?.currentPrice, changeRate: priceInfo?.changePercent }
          })
          setResults(mergedResults)
        } else {
          setResults([])
        }
      } catch {
        setSearchError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
      } finally {
        setIsSearching(false)
      }
    }, 400) // 💡 서버 부하 방지를 위해 디바운스 시간을 400ms로 소폭 조정
  }, [query])

  const handleAdd = (result: SearchResult) => {
    onAdd({
      ticker:   result.ticker,
      name:     result.name,
      currency: result.isKorean ? "KRW" : "USD",
    })
    onClose()
  }

  const formatPrice = (price: number | undefined, isKorean: boolean) => {
    if (price === undefined || price === 0) return "---"
    if (isKorean) return `${Math.round(price).toLocaleString()}원`
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      <div
        className="fixed bottom-[60px] left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ height: "75dvh" }}
      >
        {/* 헤더 부분 */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-black text-slate-900">종목 추가</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 검색 입력창 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="종목명 또는 티커 (예: Apple, 삼성)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none min-w-0"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />}
          </div>
        </div>

        {/* 결과 리스트 영역 */}
        <div className="flex-1 overflow-y-auto px-3 pb-10">
          {searchError && <p className="text-center text-[12px] font-bold text-rose-400 py-6 px-4">{searchError}</p>}

          {!query && (
            <div className="py-6 text-center">
              <p className="text-[12px] font-bold text-slate-300 mb-4">실시간 시세가 포함된 인기 종목</p>
              <div className="flex flex-wrap justify-center gap-2">
                {PRESET_TICKERS.map((t) => (
                  <button key={t} onClick={() => setQuery(t)} className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">{t}</button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && !isSearching && (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={result.ticker}
                  onClick={() => handleAdd(result)}
                  className="w-full flex items-center justify-between px-3 py-4 rounded-2xl hover:bg-slate-50 active:bg-emerald-50 transition-all group"
                >
                  <div className="text-left min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-slate-800">{result.ticker}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${result.isKorean ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"}`}>
                        {result.exchange || (result.isKorean ? "KR" : "US")}
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-500 mt-0.5 truncate">{result.name}</p>
                  </div>

                  {/* 우측 가격 및 등락률 영역 */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-[14px] font-black text-slate-800 whitespace-nowrap">
                      {formatPrice(result.price, result.isKorean)}
                    </p>
                    {result.changeRate !== undefined && (
                      <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                        result.changeRate > 0 ? "text-rose-500 bg-rose-50" : 
                        result.changeRate < 0 ? "text-blue-500 bg-blue-50" : "text-slate-400 bg-slate-50"
                      }`}>
                        {result.changeRate > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : result.changeRate < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                        {result.changeRate.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-500 flex items-center justify-center transition-all shrink-0 ml-3">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && !isSearching && results.length === 0 && !searchError && (
             <p className="text-center text-[12px] font-bold text-slate-300 py-10">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </>
  )
}