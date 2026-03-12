"use client"

/**
 * components/dukgu/sijang/stock-search-bar.tsx
 * ==============================================
 * 💡 이 컴포넌트는 증시 페이지 전용 검색창이에요.
 *    일반 SearchBar와 다르게 '자동완성 드롭다운'이 붙어있어요.
 *
 *    사용자가 "삼성"을 입력하면:
 *    1. 0.4초 뒤에 /api/stock/search?q=삼성 으로 요청을 보내요
 *    2. 야후 파이낸스가 연관 종목 목록을 알려줘요
 *    3. 드롭다운에 카드 형태로 추천 목록이 떠요
 *    4. 클릭하면 해당 종목 상세 페이지로 이동해요!
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"

// 검색 결과 한 건의 타입
interface SearchResult {
  ticker:   string   // "005930.KS", "AAPL"
  name:     string   // "삼성전자", "Apple Inc."
  exchange: string   // "코스피", "나스닥"
  isKorean: boolean
}

interface StockSearchBarProps {
  // 💡 onQueryChange: 탭 내부 필터링(보유/관심 탭)에도 같이 쓰여요
  onQueryChange: (query: string) => void
}

export function StockSearchBar({ onQueryChange }: StockSearchBarProps) {
  const router = useRouter()

  const [inputValue,   setInputValue]   = useState("")
  const [results,      setResults]      = useState<SearchResult[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 검색 실행 (디바운스 적용) ───────────────────────────────────────────
  // 💡 디바운스: 키를 누를 때마다 API를 호출하면 너무 많은 요청이 가요.
  //    0.4초 동안 입력이 없으면 그때 한 번만 검색해요.
  //    마치 '말이 끊기기를 기다렸다가 질문하는' 것과 같아요!
  const search = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    try {
      // 💡 /api/stock/search → 야후 파이낸스 검색 → 티커 목록 반환
      const res  = await fetch(`/api/stock/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setShowDropdown(true)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 입력값 변경 시 처리
  const handleChange = (val: string) => {
    setInputValue(val)
    onQueryChange(val)          // 보유/관심 탭 필터링에도 전달

    // 기존 타이머 취소 후 새 타이머 시작
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  // 초기화 버튼
  const handleClear = () => {
    setInputValue("")
    onQueryChange("")
    setResults([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  // ── 종목 선택 시 상세 페이지로 이동 ─────────────────────────────────────
  // 💡 이 과정이 '가이드(야후)가 알려준 장부 번호로 실제 서랍을 여는' 과정이에요!
  //    예: 삼성전자 클릭 → /assets/stock/005930.KS 로 이동
  const handleSelect = (result: SearchResult) => {
    setShowDropdown(false)
    setInputValue("")
    onQueryChange("")
    router.push(`/assets/stock/${encodeURIComponent(result.ticker)}`)
  }

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current  && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    // 💡 relative: 드롭다운이 이 div를 기준으로 absolute 위치를 잡아요
    <div className="relative w-full">

      {/* ── 검색 입력창 ──────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading
            ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            : <Search  className="w-4 h-4 text-gray-400" />
          }
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
          placeholder="종목명 · 티커 검색 (예: 삼성전자, AAPL)"
          autoComplete="off"
          className="w-full h-10 bg-white border border-[#E5E7EB] rounded-[10px] px-3 pl-9 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all duration-200"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5 transition-colors"
          >
            <X className="w-[10px] h-[10px]" />
          </button>
        )}
      </div>

      {/* ── 자동완성 드롭다운 ─────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden"
        >
          {results.length === 0 ? (
            <div className="px-4 py-5 text-center text-[13px] font-bold text-slate-400">
              검색 결과가 없어요
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {results.map((r) => (
                <button
                  key={r.ticker}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  {/* 로고 이니셜 배지 */}
                  <div className="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-500 shrink-0">
                    {(r.name[0] || r.ticker[0]).toUpperCase()}
                  </div>

                  {/* 종목 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-slate-900 truncate">{r.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">{r.ticker}</p>
                  </div>

                  {/* 거래소 뱃지 */}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    r.isKorean
                      ? "bg-blue-50 text-blue-500"
                      : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {r.exchange || (r.isKorean ? "KR" : "US")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
