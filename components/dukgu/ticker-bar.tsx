"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"

const SYMBOL_ORDER = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X", "JPYKRW=X"]

interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
}

interface DbRow {
  symbol: string
  name: string
  price: number
  change: number
  change_rate: number
  change_status: "up" | "down" | "same"
}

function mapRow(row: DbRow): IndexQuote {
  return {
    symbol: row.symbol,
    name: row.name,
    price: row.price,
    change: row.change,
    changeRate: row.change_rate,
    changeStatus: row.change_status,
  }
}

function sortByOrder(items: IndexQuote[]): IndexQuote[] {
  return [...items].sort((a, b) => {
    const ai = SYMBOL_ORDER.indexOf(a.symbol)
    const bi = SYMBOL_ORDER.indexOf(b.symbol)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

function IndexChip({ index, fresh }: { index: IndexQuote; fresh: boolean }) {
  const isUp = index.changeStatus === "up"
  const isDown = index.changeStatus === "down"
  const displayPrice = index.symbol === "JPYKRW=X" ? index.price * 100 : index.price;
  const displayName = index.symbol === "JPYKRW=X" ? "엔/원(100엔)" : index.name;

  return (
    <div className="inline-flex items-center gap-2 px-4 whitespace-nowrap border-r border-slate-200 h-9 shrink-0 select-none">
      <span className="text-[11px] font-medium text-slate-500">{displayName}</span>
      <span className={`text-[12px] font-bold transition-all duration-500 ${
        fresh ? (isUp ? "text-emerald-400 scale-110" : isDown ? "text-rose-400 scale-110" : "text-blue-400") : "text-slate-800"
      }`}>
        {index.symbol.includes("=X") ? `${displayPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원` : displayPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </span>
      <span className={`text-[11px] font-semibold ${isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-slate-400"}`}>
        {isUp ? "▲" : isDown ? "▼" : ""}{index.changeRate.toFixed(2)}%
      </span>
    </div>
  )
}

export function TickerBar() {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [hasData, setHasData] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fresh, setFresh] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  
  // 💡 [개선] 소수점 단위 스크롤을 정확히 계산하기 위한 정밀 기록장
  const scrollPosRef = useRef(0) 
  
  const [isInteracting, setIsInteracting] = useState(false)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  // 1. 데이터 로드 및 리얼타임 구독
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("market_indices").select("*")
      if (error) { setFailed(true); return; }
      if (data) { setIndices(sortByOrder(data.map(mapRow))); setHasData(true); }
    }
    fetchData()

    const channel = supabase.channel("market_indices_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "market_indices" }, (payload) => {
        setIndices(prev => prev.map(idx => idx.symbol === (payload.new as DbRow).symbol ? mapRow(payload.new as DbRow) : idx))
        setFresh(true);
        setTimeout(() => setFresh(false), 700);
      }).subscribe()
    return () => { supabase.removeChannel(channel); }
  }, [])

  // 2. 무한 자동 흐르기 로직 (모바일 멈춤 현상 해결)
  useEffect(() => {
    if (!hasData || isInteracting) return;

    const scroll = () => {
      if (scrollRef.current) {
        // 브라우저의 정수값 scrollLeft 대신, useRef에 소수점을 계속 더함
        scrollPosRef.current += 0.8; 
        
        // 실제 화면을 옮길 때 소수점 값을 대입 (브라우저가 최적으로 렌더링함)
        scrollRef.current.scrollLeft = scrollPosRef.current;
        
        // 무한 루프 체크: 절반 이상 가면 다시 처음으로
        if (scrollPosRef.current >= scrollRef.current.scrollWidth / 2) {
          scrollPosRef.current = 0;
          scrollRef.current.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [hasData, isInteracting, indices]);

  // 3. 유저 수동 슬라이드(드래그) 이벤트 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsInteracting(true);
    dragState.current.isDragging = true;
    dragState.current.startX = e.pageX;
    if (scrollRef.current) {
      dragState.current.scrollLeft = scrollRef.current.scrollLeft;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.isDragging || !scrollRef.current) return;
    
    // 💡 [핵심] 모바일 브라우저의 스크롤 가로채기 방지
    if (e.cancelable) e.preventDefault(); 

    const x = e.pageX;
    const walk = (dragState.current.startX - x) * 1.5; // 슬라이드 감도
    let nextScrollLeft = dragState.current.scrollLeft + walk;

    const halfWidth = scrollRef.current.scrollWidth / 2;

    // 수동 조작 시에도 루프가 끊기지 않게 보정
    if (nextScrollLeft >= halfWidth) {
      nextScrollLeft -= halfWidth;
      dragState.current.startX = x;
      dragState.current.scrollLeft = nextScrollLeft;
    } else if (nextScrollLeft <= 0) {
      nextScrollLeft += halfWidth;
      dragState.current.startX = x;
      dragState.current.scrollLeft = nextScrollLeft;
    }

    scrollRef.current.scrollLeft = nextScrollLeft;
    scrollPosRef.current = nextScrollLeft; // 자동 흐름 재개 시 위치 동기화
  };

  const handlePointerUpOrLeave = () => {
    setIsInteracting(false);
    dragState.current.isDragging = false;
  };

  const tickerItems = useMemo(() => [...indices, ...indices], [indices])

  if (failed) return null
  if (!hasData || indices.length === 0) return <div className="h-9 bg-white border-b border-slate-200 w-full" />

  return (
    <div className="bg-white border-b border-slate-200 h-9 flex items-center relative w-full overflow-hidden">
      {/* 'On' 고정 레이블 */}
      <div className="flex items-center px-3 bg-white z-20 h-full border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.03)] shrink-0">
        <span className="relative flex h-1.5 w-1.5 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-black text-slate-700 uppercase">On</span>
      </div>

      {/* 스크롤 및 슬라이드 인터랙션 영역 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-hidden h-full flex items-center scrollbar-hide"
        style={{ 
          scrollBehavior: 'auto', 
          cursor: isInteracting ? 'grabbing' : 'grab',
          // 💡 [핵심] 모바일 터치 시 브라우저가 멋대로 페이지를 넘기지 못하게 함
          touchAction: 'none' 
        }} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
      >
        <div className="flex items-center">
          {tickerItems.map((idx, i) => (
            <IndexChip key={`${idx.symbol}-${i}`} index={idx} fresh={fresh} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}