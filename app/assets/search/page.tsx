"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, X, Clock, TrendingUp, Loader2 } from "lucide-react"

interface SearchResult {
  ticker:   string
  name:     string
  exchange: string
  isKorean: boolean
}

// 인기 종목: 종목명 → 티커 매핑 (목업 순위, 실시간 가격은 API로 fetch)
const POPULAR_STOCKS: { name: string; ticker: string }[] = [
  { name: "삼성전자",   ticker: "005930.KS" },
  { name: "SK하이닉스", ticker: "000660.KS" },
  { name: "NVIDIA",     ticker: "NVDA"       },
  { name: "Apple",      ticker: "AAPL"       },
  { name: "Tesla",      ticker: "TSLA"       },
  { name: "카카오",     ticker: "035720.KS"  },
  { name: "NAVER",      ticker: "035420.KS"  },
  { name: "Microsoft",  ticker: "MSFT"       },
  { name: "현대차",     ticker: "005380.KS"  },
  { name: "Google",     ticker: "GOOGL"      },
]

interface PopularQuote {
  ticker:     string
  changeRate: number
}

const STORAGE_KEY = "dukgu_recent_searches"

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveRecentSearch(name: string, ticker: string) {
  try {
    const key = "dukgu_recent_tickers"
    const prev: { name: string; ticker: string }[] = JSON.parse(localStorage.getItem(key) ?? "[]")
    const next = [{ name, ticker }, ...prev.filter((r) => r.ticker !== ticker)].slice(0, 10)
    localStorage.setItem(key, JSON.stringify(next))
    // 이름도 기존 키에 저장 (하위 호환)
    const prevNames = loadRecentSearches()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([name, ...prevNames.filter((n) => n !== name)].slice(0, 10)))
  } catch { /* ignore */ }
}

function loadRecentTickers(): { name: string; ticker: string }[] {
  try {
    return JSON.parse(localStorage.getItem("dukgu_recent_tickers") ?? "[]")
  } catch { return [] }
}

function removeRecentTicker(ticker: string) {
  try {
    const prev = loadRecentTickers()
    localStorage.setItem("dukgu_recent_tickers", JSON.stringify(prev.filter((r) => r.ticker !== ticker)))
    const prevNames = loadRecentSearches()
    const name = prev.find((r) => r.ticker === ticker)?.name
    if (name) localStorage.setItem(STORAGE_KEY, JSON.stringify(prevNames.filter((n) => n !== name)))
  } catch { /* ignore */ }
}

export default function SearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query,         setQuery]         = useState("")
  const [results,       setResults]       = useState<SearchResult[]>([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [recentItems,   setRecentItems]   = useState<{ name: string; ticker: string }[]>([])
  const [popularQuotes, setPopularQuotes] = useState<Record<string, PopularQuote>>({})

  useEffect(() => {
    setRecentItems(loadRecentTickers())
    setTimeout(() => inputRef.current?.focus(), 100)

    // 인기 종목 가격 fetch
    const tickers = POPULAR_STOCKS.map((s) => s.ticker).join(",")
    fetch(`/api/market/quotes?tickers=${tickers}`)
      .then((r) => r.json())
      .then((data: { ticker: string; changePercent: number }[]) => {
        const map: Record<string, PopularQuote> = {}
        data.forEach((q) => { map[q.ticker] = { ticker: q.ticker, changeRate: q.changePercent } })
        setPopularQuotes(map)
      })
      .catch(() => {/* 조용히 실패 */})
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setResults([]); return }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  const handleSelectResult = (result: SearchResult) => {
    saveRecentSearch(result.name, result.ticker)
    setRecentItems(loadRecentTickers())
    router.push(`/assets/stock/${encodeURIComponent(result.ticker)}`)
  }

  const handleSelectPopular = (stock: { name: string; ticker: string }) => {
    saveRecentSearch(stock.name, stock.ticker)
    router.push(`/assets/stock/${encodeURIComponent(stock.ticker)}`)
  }

  const handleSelectRecent = (item: { name: string; ticker: string }) => {
    router.push(`/assets/stock/${encodeURIComponent(item.ticker)}`)
  }

  const handleRemoveRecent = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentTicker(ticker)
    setRecentItems(loadRecentTickers())
  }

  const showResults = query.trim().length > 0

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isLoading
              ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              : <Search className="w-4 h-4 text-gray-400" />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="종목명 · 티커 검색 (예: 삼성전자, AAPL)"
            autoComplete="off"
            className="w-full h-10 bg-[#F3F4F6] rounded-[10px] px-3 pl-9 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:bg-white transition-all duration-200"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full p-0.5 transition-colors"
            >
              <X className="w-[10px] h-[10px]" />
            </button>
          )}
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4">

        {/* 검색 결과 */}
        {showResults && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[14px] font-bold text-slate-400">검색 결과가 없어요</p>
                <p className="text-[12px] text-slate-300 mt-1">다른 종목명이나 티커로 검색해보세요</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {results.map((r) => (
                  <button
                    key={r.ticker}
                    onClick={() => handleSelectResult(r)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[14px] font-black text-slate-500 shrink-0">
                      {(r.name[0] || r.ticker[0]).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black text-slate-900 truncate">{r.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{r.ticker}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      r.isKorean ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {r.exchange || (r.isKorean ? "KR" : "US")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 최근 검색어 */}
        {!showResults && recentItems.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-1.5 text-[13px] font-black text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                최근 검색
              </h2>
              <button
                onClick={() => {
                  localStorage.removeItem("dukgu_recent_tickers")
                  localStorage.removeItem(STORAGE_KEY)
                  setRecentItems([])
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                전체 삭제
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <div key={item.ticker} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                  <button
                    onClick={() => handleSelectRecent(item)}
                    className="text-[12px] font-bold text-slate-700 hover:text-emerald-600 transition-colors"
                  >
                    {item.name}
                  </button>
                  <button
                    onClick={(e) => handleRemoveRecent(item.ticker, e)}
                    className="text-slate-300 hover:text-slate-500 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 인기 검색어 */}
        {!showResults && (
          <section>
            <h2 className="flex items-center gap-1.5 text-[13px] font-black text-slate-700 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              인기 종목
              <span className="text-[10px] font-medium text-slate-400 ml-1">편집 기준</span>
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {POPULAR_STOCKS.map((stock, i) => {
                const quote = popularQuotes[stock.ticker]
                const rate  = quote?.changeRate ?? null
                const isUp  = rate != null && rate > 0
                const isDn  = rate != null && rate < 0
                return (
                  <button
                    key={stock.ticker}
                    onClick={() => handleSelectPopular(stock)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <span className={`text-[12px] font-black w-5 text-center shrink-0 ${
                      i < 3 ? "text-emerald-500" : "text-slate-300"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[14px] font-bold text-slate-800">{stock.name}</span>
                    {rate != null ? (
                      <span className={`text-[12px] font-black ${
                        isUp ? "text-rose-500" : isDn ? "text-blue-500" : "text-slate-400"
                      }`}>
                        {isUp ? "+" : ""}{rate.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="w-12 h-3 rounded bg-slate-100 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
