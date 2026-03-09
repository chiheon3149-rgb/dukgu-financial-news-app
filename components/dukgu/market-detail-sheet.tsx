"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"

// -------------------------------------------------------
// 타입
// -------------------------------------------------------
type MainTab = "indices" | "bonds" | "commodities"
type RegionTab = "all" | "kr" | "us"

interface LiveIndex {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
  region: "kr" | "us"
}

interface StaticItem {
  name: string
  value: string
  change: string
  status: "up" | "down" | "same"
  region: "kr" | "us"
  unit?: string
}

// -------------------------------------------------------
// 모의(Mock) 데이터 — 채권·원자재 (카카오톡 이미지 기반)
// -------------------------------------------------------
const MOCK_BONDS: StaticItem[] = [
  { name: "한국 국채 2년",  value: "2.992", change: "+0.024 (0.8%)",  status: "up",   region: "kr" },
  { name: "한국 국채 3년",  value: "3.228", change: "+0.039 (1.2%)",  status: "up",   region: "kr" },
  { name: "한국 국채 5년",  value: "3.472", change: "+0.028 (0.8%)",  status: "up",   region: "kr" },
  { name: "한국 국채 10년", value: "3.616", change: "+0.024 (0.6%)",  status: "up",   region: "kr" },
  { name: "한국 국채 20년", value: "3.618", change: "+0.017 (0.4%)",  status: "up",   region: "kr" },
  { name: "한국 국채 30년", value: "3.518", change: "+0.014 (0.3%)",  status: "up",   region: "kr" },
  { name: "미국 국채 2년",  value: "3.60",  change: "+0.05 (1.4%)",   status: "up",   region: "us" },
  { name: "미국 국채 5년",  value: "3.78",  change: "+0.07 (1.8%)",   status: "up",   region: "us" },
  { name: "미국 국채 10년", value: "4.19",  change: "+0.06 (1.4%)",   status: "up",   region: "us" },
  { name: "미국 국채 30년", value: "4.79",  change: "+0.04 (0.8%)",   status: "up",   region: "us" },
]

const MOCK_COMMODITIES: StaticItem[] = [
  { name: "금",     value: "5,059.7", change: "-99 (1.9%)",    status: "down", region: "us", unit: "달러/트로이온스" },
  { name: "은",     value: "81.48",   change: "-2.83 (3.3%)",  status: "down", region: "us", unit: "달러/트로이온스" },
  { name: "WTI",    value: "108.1",   change: "+17.2 (18.9%)", status: "up",   region: "us", unit: "달러/배럴" },
  { name: "천연가스", value: "3.39",  change: "+0.21 (6.6%)",  status: "up",   region: "us", unit: "달러/MMBtu" },
  { name: "구리",   value: "5.69",    change: "-0.11 (1.8%)",  status: "down", region: "us", unit: "달러/파운드" },
  { name: "밀",     value: "631.2¢",  change: "+14.6 (2.3%)",  status: "up",   region: "us", unit: "센트/부셸" },
]

// DB symbol → 지역 분류
const SYMBOL_REGION: Record<string, "kr" | "us"> = {
  "^KS11": "kr", "^KQ11": "kr", "KRW=X": "kr", "JPYKRW=X": "kr",
  "^DJI": "us",  "^NDX": "us",  "^GSPC": "us", "^RUT": "us",
}

// -------------------------------------------------------
// 가격 포맷 헬퍼
// -------------------------------------------------------
function fmtPrice(sym: string, price: number): string {
  if (sym.includes("=X")) {
    const val = sym === "JPYKRW=X" ? price * 100 : price
    return `${val.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`
  }
  if (sym.startsWith("^K")) {
    return price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
  }
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtChange(sym: string, change: number, changeRate: number, status: string): string {
  const prefix = status === "up" ? "+" : ""
  if (sym.includes("=X")) {
    return `${prefix}${changeRate.toFixed(2)}%`
  }
  return `${prefix}${changeRate.toFixed(2)}%`
}

// -------------------------------------------------------
// 행(Row) 컴포넌트
// -------------------------------------------------------
function MarketRow({ name, value, change, status, unit }: {
  name: string; value: string; change: string; status: "up" | "down" | "same"; unit?: string
}) {
  const isUp   = status === "up"
  const isDown = status === "down"
  const valueColor = isUp ? "text-rose-500" : isDown ? "text-blue-500" : "text-slate-700"
  const changeColor = isUp ? "text-rose-400" : isDown ? "text-blue-400" : "text-slate-400"

  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-slate-700">{name}</p>
        {unit && <p className="text-[10px] text-slate-300 mt-0.5">{unit}</p>}
      </div>
      <div className="text-right">
        <p className={`text-[16px] font-black ${valueColor}`}>{value}</p>
        <p className={`text-[11px] font-semibold ${changeColor}`}>{change}</p>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// 탭 버튼 컴포넌트
// -------------------------------------------------------
function Tab<T extends string>({
  id, label, active, onClick,
}: { id: T; label: string; active: boolean; onClick: (id: T) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 py-2.5 text-[13px] font-black transition-all ${
        active
          ? "text-slate-900 border-b-2 border-slate-900"
          : "text-slate-400 border-b-2 border-transparent hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  )
}

function RegionBtn<T extends string>({
  id, label, active, onClick,
}: { id: T; label: string; active: boolean; onClick: (id: T) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  )
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------
interface MarketDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  /** 클릭한 심볼 (옵션: 해당 탭으로 자동 이동) */
  initialSymbol?: string
}

export function MarketDetailSheet({ isOpen, onClose, initialSymbol }: MarketDetailSheetProps) {
  const [mainTab, setMainTab]     = useState<MainTab>("indices")
  const [regionTab, setRegionTab] = useState<RegionTab>("all")
  const [liveIndices, setLiveIndices] = useState<LiveIndex[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 시트가 열릴 때 초기 탭 결정
  useEffect(() => {
    if (!isOpen) return
    if (initialSymbol) {
      const region = SYMBOL_REGION[initialSymbol]
      setMainTab("indices")
      setRegionTab(region ?? "all")
    } else {
      setRegionTab("all")
    }
  }, [isOpen, initialSymbol])

  // 지수·환율 실시간 데이터 로드
  useEffect(() => {
    if (!isOpen || mainTab !== "indices") return
    setIsLoading(true)
    supabase
      .from("market_indices")
      .select("symbol, name, price, change, change_rate, change_status")
      .then(({ data }) => {
        if (data) {
          const mapped: LiveIndex[] = data.map((r) => ({
            symbol: r.symbol,
            name: r.symbol === "JPYKRW=X" ? "엔/원(100엔)" : r.name,
            price: r.price,
            change: r.change,
            changeRate: r.change_rate,
            changeStatus: r.change_status,
            region: SYMBOL_REGION[r.symbol] ?? "us",
          }))
          setLiveIndices(mapped)
        }
        setIsLoading(false)
      })
  }, [isOpen, mainTab])

  // 지역 필터 적용
  const filteredIndices = liveIndices.filter(
    (i) => regionTab === "all" || i.region === regionTab
  )
  const filteredBonds = MOCK_BONDS.filter(
    (b) => regionTab === "all" || b.region === regionTab
  )
  // 원자재는 전체/해외만 있음
  const filteredCommodities =
    regionTab === "kr" ? [] : MOCK_COMMODITIES

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ height: "88dvh" }}
      >
        {/* 핸들 + 헤더 */}
        <div className="px-5 pt-4 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[18px] font-black text-slate-900">주요 지수</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 메인 탭 */}
          <div className="flex border-b border-slate-100 mt-1">
            <Tab id="indices"    label="지수·환율" active={mainTab === "indices"}    onClick={setMainTab} />
            <Tab id="bonds"      label="채권"       active={mainTab === "bonds"}      onClick={setMainTab} />
            <Tab id="commodities" label="원자재"    active={mainTab === "commodities"} onClick={setMainTab} />
          </div>

          {/* 지역 탭 */}
          <div className="flex items-center gap-2 pt-3 pb-2">
            <RegionBtn id="all" label="전체" active={regionTab === "all"} onClick={setRegionTab} />
            <RegionBtn id="kr"  label="국내" active={regionTab === "kr"}  onClick={setRegionTab} />
            <RegionBtn id="us"  label="해외" active={regionTab === "us"}  onClick={setRegionTab} />
          </div>
        </div>

        {/* 데이터 영역 */}
        <div className="flex-1 overflow-y-auto px-5 pb-10">
          {/* 모의 데이터 안내 뱃지 */}
          {mainTab !== "indices" && (
            <div className="mb-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600">
                📌 채권·원자재는 현재 모의 데이터입니다. 실시간 연동 예정
              </p>
            </div>
          )}

          {/* 지수·환율 */}
          {mainTab === "indices" && (
            <div>
              {isLoading ? (
                <div className="space-y-4 pt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredIndices.length === 0 ? (
                <p className="text-center text-sm text-slate-300 font-bold py-16">
                  데이터가 없습니다
                </p>
              ) : (
                filteredIndices.map((idx) => (
                  <MarketRow
                    key={idx.symbol}
                    name={idx.name}
                    value={fmtPrice(idx.symbol, idx.price)}
                    change={fmtChange(idx.symbol, idx.change, idx.changeRate, idx.changeStatus)}
                    status={idx.changeStatus}
                  />
                ))
              )}
            </div>
          )}

          {/* 채권 */}
          {mainTab === "bonds" && (
            <div>
              {filteredBonds.length === 0 ? (
                <p className="text-center text-sm text-slate-300 font-bold py-16">
                  해당 지역 채권 데이터가 없습니다
                </p>
              ) : (
                filteredBonds.map((b) => (
                  <MarketRow
                    key={b.name}
                    name={b.name}
                    value={b.value}
                    change={b.change}
                    status={b.status}
                  />
                ))
              )}
            </div>
          )}

          {/* 원자재 */}
          {mainTab === "commodities" && (
            <div>
              {filteredCommodities.length === 0 ? (
                <p className="text-center text-sm text-slate-300 font-bold py-16">
                  국내 원자재 데이터가 없습니다
                </p>
              ) : (
                filteredCommodities.map((c) => (
                  <MarketRow
                    key={c.name}
                    name={c.name}
                    value={c.value}
                    change={c.change}
                    status={c.status}
                    unit={c.unit}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
