"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, RotateCcw, Pencil, Check, Trash2, Plus, Eye, EyeOff, Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// -------------------------------------------------------
// 설정 저장/불러오기
// -------------------------------------------------------
export const TICKER_STORAGE_KEY    = "dukgu_ticker_v1"
export const TICKER_SETTINGS_CHANGED = "tickerSettingsChanged"

export const DEFAULT_TICKER_NAMES: Record<string, string> = {
  "^DJI":     "다우존스",
  "^NDX":     "나스닥100",
  "^GSPC":    "S&P500",
  "^RUT":     "러셀2000",
  "^KS11":    "코스피",
  "^KQ11":    "코스닥",
  "KRW=X":    "달러/원",
  "JPYKRW=X": "엔/원(100엔)",
}

export interface TickerSettings {
  customNames:   Record<string, string>
  hiddenSymbols: string[]
  customTickers: string[]
}

export function loadTickerSettings(): TickerSettings {
  if (typeof window === "undefined")
    return { customNames: {}, hiddenSymbols: [], customTickers: [] }
  try {
    const raw = localStorage.getItem(TICKER_STORAGE_KEY)
    if (!raw) return { customNames: {}, hiddenSymbols: [], customTickers: [] }
    const parsed = JSON.parse(raw) as Partial<TickerSettings>
    return {
      customNames:   parsed.customNames   ?? {},
      hiddenSymbols: parsed.hiddenSymbols ?? [],
      customTickers: parsed.customTickers ?? [],
    }
  } catch {
    return { customNames: {}, hiddenSymbols: [], customTickers: [] }
  }
}

export function saveTickerSettings(settings: TickerSettings): void {
  localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(TICKER_SETTINGS_CHANGED))
}

// -------------------------------------------------------
// DB 로드 / 저장 (로그인 유저만)
// -------------------------------------------------------
export async function loadTickerSettingsFromDb(): Promise<TickerSettings | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("user_ticker_settings")
    .select("settings")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null
  return data.settings as TickerSettings
}

export async function saveTickerSettingsToDb(settings: TickerSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("user_ticker_settings")
    .upsert({ user_id: user.id, settings }, { onConflict: "user_id" })
}

// -------------------------------------------------------
// 컴포넌트
// -------------------------------------------------------
interface TickerSettingsSheetProps {
  isOpen:   boolean
  onClose:  () => void
  symbols:  string[]
  settings: TickerSettings
  onSave:   (s: TickerSettings) => void
}

export function TickerSettingsSheet({
  isOpen,
  onClose,
  symbols,
  settings,
  onSave,
}: TickerSettingsSheetProps) {
  const [customNames,   setCustomNames]   = useState<Record<string, string>>({})
  const [hiddenSymbols, setHiddenSymbols] = useState<string[]>([])
  const [customTickers, setCustomTickers] = useState<string[]>([])

  const [editingSymbol, setEditingSymbol] = useState<string | null>(null)
  const [editValue,     setEditValue]     = useState("")

  const [addInput,       setAddInput]       = useState("")
  const [addError,       setAddError]       = useState("")
  const [searchResults,  setSearchResults]  = useState<Array<{ symbol: string; shortname: string; exchDisp: string; typeDisp: string }>>([])
  const [isSearching,    setIsSearching]    = useState(false)
  const [showDropdown,   setShowDropdown]   = useState(false)
  const addInputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef    = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시트가 열리는 순간(isOpen: false→true)에만 초기화
  // settings를 의존성에 넣으면 DB 로드 완료 시 사용자 변경값이 덮어써짐
  useEffect(() => {
    if (!isOpen) return
    setCustomNames({ ...settings.customNames })
    setHiddenSymbols([...(settings.hiddenSymbols ?? [])])
    setCustomTickers([...(settings.customTickers ?? [])])
    setEditingSymbol(null)
    setAddInput("")
    setAddError("")
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const getDisplayName = (sym: string) =>
    customNames[sym] ?? DEFAULT_TICKER_NAMES[sym] ?? sym

  // ── 기본 심볼 표시명 편집 ──
  const startEdit = (sym: string) => {
    setEditingSymbol(sym)
    setEditValue(getDisplayName(sym))
  }

  const commitEdit = (sym: string) => {
    const trimmed = editValue.trim().slice(0, 10)
    if (trimmed && trimmed !== DEFAULT_TICKER_NAMES[sym]) {
      setCustomNames((prev) => ({ ...prev, [sym]: trimmed }))
    } else {
      const next = { ...customNames }
      delete next[sym]
      setCustomNames(next)
    }
    setEditingSymbol(null)
  }

  // ── 기본 심볼 눈 아이콘으로 표시/숨김 ──
  const toggleHide = (sym: string) => {
    setHiddenSymbols((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    )
  }

  // ── 커스텀 티커 표시명 편집 ──
  const startCustomEdit = (sym: string) => {
    setEditingSymbol(`custom_${sym}`)
    setEditValue(customNames[sym] ?? sym)
  }

  const commitCustomEdit = (sym: string) => {
    const trimmed = editValue.trim().slice(0, 10)
    if (trimmed && trimmed !== sym) {
      setCustomNames((prev) => ({ ...prev, [sym]: trimmed }))
    } else {
      const next = { ...customNames }
      delete next[sym]
      setCustomNames(next)
    }
    setEditingSymbol(null)
  }

  // ── 커스텀 티커 삭제 ──
  const removeCustom = (sym: string) => {
    setCustomTickers((prev) => prev.filter((s) => s !== sym))
    const next = { ...customNames }
    delete next[sym]
    setCustomNames(next)
  }

  // ── 검색 자동완성 (디바운스 300ms) ──
  useEffect(() => {
    const q = addInput.trim()
    if (!q) { setSearchResults([]); setShowDropdown(false); return }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const json = await res.json()
          setSearchResults(json.quotes ?? [])
          setShowDropdown(true)
        }
      } catch { /* ignore */ } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [addInput])

  const selectSuggestion = useCallback((sym: string, name: string) => {
    setAddInput(sym)
    setCustomNames((prev) => ({ ...prev, [sym]: name }))
    setShowDropdown(false)
    setSearchResults([])
    addInputRef.current?.focus()
  }, [])

  // ── 새 티커 추가 ──
  const handleAdd = () => {
    const sym = addInput.trim().toUpperCase()
    if (!sym) return
    if (symbols.includes(sym) || customTickers.includes(sym)) {
      setAddError("이미 추가된 심볼입니다")
      return
    }
    if (sym.length > 20) {
      setAddError("심볼이 너무 깁니다 (최대 20자)")
      return
    }
    setCustomTickers((prev) => [...prev, sym])
    setAddInput("")
    setAddError("")
    setShowDropdown(false)
    setSearchResults([])
    addInputRef.current?.focus()
  }

  // ── 저장: localStorage 즉시 → UI 닫기 → DB는 백그라운드 ──
  const handleSave = () => {
    const s: TickerSettings = { customNames, hiddenSymbols, customTickers }
    // 1. 티커바 즉시 반영
    onSave(s)
    // 2. localStorage 저장 (이벤트 발행 포함)
    saveTickerSettings(s)
    // 3. 시트 즉시 닫기 (DB 응답 기다리지 않음)
    onClose()
    // 4. DB 저장 (백그라운드, 로그인 시만)
    saveTickerSettingsToDb(s).catch((err) =>
      console.error("[ticker-settings] DB 저장 오류:", err)
    )
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      <div
        className="fixed left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 flex flex-col overflow-hidden"
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
          maxHeight: "calc(88dvh - 4rem - env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* 핸들 + 헤더 */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-black text-slate-900">지수 설정</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                눈 아이콘으로 표시/숨김 · 이름 편집 · 티커 추가
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCustomNames({}); setHiddenSymbols([]); setCustomTickers([]) }}
                className="text-[11px] font-bold text-slate-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                초기화
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* 리스트 */}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3 space-y-5">

          {/* ── 기본 지수 ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              기본 지수
            </p>
            <div className="space-y-1.5">
              {symbols.map((sym) => {
                const isHidden  = hiddenSymbols.includes(sym)
                const isEditing = editingSymbol === sym
                const hasCustom = !!customNames[sym]

                return (
                  <div
                    key={sym}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                      isHidden ? "opacity-35 bg-transparent" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(sym)
                              if (e.key === "Escape") setEditingSymbol(null)
                            }}
                            maxLength={10}
                            className="text-[13px] font-bold text-slate-900 bg-white border border-emerald-400 rounded-xl px-2.5 py-1.5 focus:outline-none w-32 focus:ring-2 focus:ring-emerald-100"
                          />
                          <button
                            onClick={() => commitEdit(sym)}
                            className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-slate-900 truncate">
                            {getDisplayName(sym)}
                          </span>
                          {hasCustom && (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                              수정됨
                            </span>
                          )}
                          <span className="text-[10px] text-slate-300 shrink-0">{sym}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(sym)}
                          className="p-1.5 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                          title="표시명 편집"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                      {/* 눈 아이콘: 표시/숨김 토글 */}
                      <button
                        onClick={() => toggleHide(sym)}
                        className="p-1.5 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                        title={isHidden ? "티커바에 표시" : "티커바에서 숨김"}
                      >
                        {isHidden
                          ? <EyeOff className="w-4 h-4 text-slate-300" />
                          : <Eye    className="w-4 h-4 text-emerald-500" />
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {hiddenSymbols.length > 0 && (
              <p className="text-[10px] text-slate-300 font-medium mt-2 px-1">
                숨긴 항목: {hiddenSymbols.length}개 · 눈 아이콘을 다시 누르면 복원됩니다
              </p>
            )}
          </div>

          {/* ── 직접 추가한 티커 ── */}
          {customTickers.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                직접 추가한 티커
              </p>
              <div className="space-y-1.5">
                {customTickers.map((sym) => {
                  const isEditing   = editingSymbol === `custom_${sym}`
                  const hasCustomNm = !!customNames[sym]

                  return (
                    <div
                      key={sym}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-emerald-50 border border-emerald-100"
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitCustomEdit(sym)
                                if (e.key === "Escape") setEditingSymbol(null)
                              }}
                              maxLength={10}
                              className="text-[13px] font-bold text-slate-900 bg-white border border-emerald-400 rounded-xl px-2.5 py-1.5 focus:outline-none w-32"
                            />
                            <button
                              onClick={() => commitCustomEdit(sym)}
                              className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-bold text-emerald-900 truncate">
                              {hasCustomNm ? customNames[sym] : sym}
                            </span>
                            {hasCustomNm && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                                수정됨
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-400 shrink-0">{sym}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isEditing && (
                          <button
                            onClick={() => startCustomEdit(sym)}
                            className="p-1.5 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}
                        <button
                          onClick={() => removeCustom(sym)}
                          className="p-1.5 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 새 티커 추가 ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              티커 추가
            </p>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={addInputRef}
                    value={addInput}
                    onChange={(e) => { setAddInput(e.target.value); setAddError("") }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd()
                      if (e.key === "Escape") { setShowDropdown(false); setSearchResults([]) }
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="예: TSLA, NVDA, 005930.KS"
                    maxLength={20}
                    className="w-full text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-300 placeholder:font-normal"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 animate-spin" />
                  )}
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!addInput.trim()}
                  className="flex items-center justify-center gap-1 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[12px] rounded-2xl transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가
                </button>
              </div>

              {/* 자동완성 드롭다운 */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-12 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto"
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onMouseDown={(e) => { e.preventDefault(); selectSuggestion(result.symbol, result.shortname) }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 truncate">{result.symbol}</p>
                        <p className="text-[10px] text-slate-400 truncate">{result.shortname}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 shrink-0">{result.exchDisp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {addError && (
              <p className="text-[11px] text-rose-500 font-bold mt-1.5 px-1">{addError}</p>
            )}
            <p className="text-[10px] text-slate-300 font-medium mt-2 px-1">
              종목명·심볼 입력 시 자동완성 · 야후 파이낸스 기준
            </p>
          </div>

          <p className="text-center text-[10px] text-slate-300 font-medium pb-1">
            로그인 시 기기간 설정 동기화됩니다
          </p>

          {/* 저장 버튼 - sticky로 항상 하단에 표시 */}
          <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-white border-t border-slate-100">
            <button
              onClick={handleSave}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-[14px] rounded-2xl transition-all shadow-lg shadow-emerald-200"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
