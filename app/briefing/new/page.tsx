"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, ShieldCheck, TrendingUp, Calendar as CalendarIcon, Clock, Newspaper, CheckCircle2, Search, Activity, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useBriefingAdmin } from "@/hooks/use-briefing-admin"
import { useUser } from "@/context/user-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 💡 폼 입력용 타입 정의 (기획자님 SQL 규격 완벽 반영)
interface IndexInput { name: string; change: string }
interface KpiInput { label: string; value: string; change: string; status: string; statusColor: "rose" | "blue" | "amber" | "slate" }
interface MarketInput { name: string; val: string; change: string; status: string }
interface ScheduleInput { dDay: string; title: string; description: string; isUrgent: boolean }
interface NewsItemInput { stars: number; cat: string; color: "blue" | "emerald" | "slate"; title: string; summary: string; insight: string; link: string }
interface SummaryInput { summary: string; quote: string; author: string }

export default function NewBriefingPage() {
  const router = useRouter()
  const { saveBriefing } = useBriefingAdmin()
  const { profile, isLoading } = useUser()

  const today = new Date().toISOString().split("T")[0]

  // 1. 기본 정보 상태
  const [date, setDate] = useState(today)
  const [type, setType] = useState<"morning" | "afternoon">("morning")
  const [time, setTime] = useState("08:30")
  const [headline, setHeadline] = useState("")
  
  // 2. 외부 지표 (indices)
  const [indices, setIndices] = useState<IndexInput[]>([{ name: "코스피", change: "" }])

  // 3. KPI 트래커 상태
  const [kpis, setKpis] = useState<KpiInput[]>([
    { label: "원/달러 환율", value: "", change: "", status: "", statusColor: "rose" }
  ])

  // 4. 마켓 인덱스(markets) 상태
  const [markets, setMarkets] = useState<MarketInput[]>([
    { name: "코스피", val: "", change: "", status: "" }
  ])

  // 5. 스케줄(schedule) 상태
  const [schedule, setSchedule] = useState<ScheduleInput[]>([
    { dDay: "D-Day", title: "", description: "", isUrgent: false }
  ])

  // 6. 개별 뉴스 항목 상태
  const [newsItems, setNewsItems] = useState<NewsItemInput[]>([
    { stars: 5, cat: "Eco", color: "slate", title: "", summary: "", insight: "", link: "" }
  ])

  // 7. 총평(Summary) 상태
  const [summaryData, setSummaryData] = useState<SummaryInput>({
    summary: "", quote: "", author: "Anonymous"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 보안 체크
  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      toast.error("관리자(VIP) 전용 공간입니다. 🚨")
      router.replace("/") 
    }
  }, [profile, isLoading, router])

  useEffect(() => {
    if (type === "morning") setTime("08:30")
    if (type === "afternoon") setTime("16:30")
  }, [type])

  // 동적 리스트 조작 헬퍼 함수들
  const updateList = (setter: any, list: any[], idx: number, field: string, value: any) => {
    const newList = [...list]
    newList[idx] = { ...newList[idx], [field]: value }
    setter(newList)
  }
  const removeList = (setter: any, list: any[], idx: number) => setter(list.filter((_: any, i: number) => i !== idx))

  const handleSubmit = async () => {
    if (!headline.trim() || !date || !time || isSubmitting) return
    setIsSubmitting(true)
    
    try {
      // 빈 값 걸러내기 (빈 제목이나 빈 라벨은 저장 안 함)
      const validIndices = indices.filter(i => i.name.trim() !== "")
      const validKpis = kpis.filter(k => k.label.trim() !== "")
      const validMarkets = markets.filter(m => m.name.trim() !== "")
      const validSchedule = schedule.filter(s => s.title.trim() !== "")
      const validNewsItems = newsItems.filter(n => n.title.trim() !== "")

      await saveBriefing({
        date,
        type,
        time,
        headline: headline.trim(),
        indices: validIndices.length > 0 ? validIndices : null,
        kpis: validKpis.length > 0 ? validKpis : null,
        markets: validMarkets.length > 0 ? validMarkets : null,
        schedule: validSchedule.length > 0 ? validSchedule : null,
        news_items: validNewsItems.length > 0 ? validNewsItems : null,
        summary_data: summaryData.summary.trim() ? summaryData : null,
      })

      toast.success(`${type === "morning" ? "조간" : "마감"} 브리핑이 발행되었습니다! ⚡`)
      router.replace("/briefing") 
    } catch (error: any) {
      console.error("발행 에러:", error.message || error)
      toast.error(`발행 실패: ${error.message || "오류가 발생했습니다."}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !profile?.is_admin) return null;
  const isValid = headline.trim().length > 0 && date && time

  return (
    <div className="min-h-dvh bg-slate-50 pb-32">
      <DetailHeader
        title="[관리자] 브리핑 발행 데스크"
        rightElement={
          <button onClick={handleSubmit} disabled={!isValid || isSubmitting} className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all flex items-center gap-1 ${isValid && !isSubmitting ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> {isSubmitting ? "발행 중..." : "발행"}
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        
        {/* 1. 기본 설정 (Date, Type, Headline) */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[11px] font-black text-slate-400 mb-2">일자</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 rounded-xl py-2 px-3 text-[13px] font-bold" /></div>
            <div><p className="text-[11px] font-black text-slate-400 mb-2">시간</p><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-50 rounded-xl py-2 px-3 text-[13px] font-bold" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setType("morning")} className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${type === "morning" ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-500"}`}>조간 (미국)</button>
            <button onClick={() => setType("afternoon")} className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${type === "afternoon" ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-500"}`}>마감 (한국)</button>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 mb-2">헤드라인 (Hero Title)</p>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="예: 코스피 6,260선 하락 마감" className="w-full bg-slate-50 rounded-xl py-3 px-4 text-[15px] font-bold" />
          </div>
        </section>

        {/* 2. 인덱스 (Hero 하단용) */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[11px] font-black text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> 외부 지수 (Indices)</p>
            <button onClick={() => setIndices([...indices, { name: "", change: "" }])} className="text-[10px] font-bold text-amber-500"><Plus className="w-3 h-3 inline" /> 추가</button>
          </div>
          <div className="space-y-2">
            {indices.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" value={item.name} onChange={(e) => updateList(setIndices, indices, idx, "name", e.target.value)} placeholder="지수명" className="flex-1 bg-slate-50 rounded-lg py-2 px-3 text-[12px] font-bold" />
                <input type="text" value={item.change} onChange={(e) => updateList(setIndices, indices, idx, "change", e.target.value)} placeholder="-0.61%" className="w-24 bg-slate-50 rounded-lg py-2 px-3 text-[12px] font-bold text-right" />
                <button onClick={() => removeList(setIndices, indices, idx)} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* 3. KPI 트래커 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[12px] font-black text-slate-800 flex items-center gap-1"><Search className="w-4 h-4 text-blue-500" /> KPI 트래커</p>
            <button onClick={() => setKpis([...kpis, { label: "", value: "", change: "", status: "", statusColor: "slate" }])} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full"><Plus className="w-3 h-3 inline" /> 추가</button>
          </div>
          <div className="space-y-4">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative space-y-2">
                <button onClick={() => removeList(setKpis, kpis, idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                <div className="grid grid-cols-2 gap-2 pr-6">
                  <input type="text" value={kpi.label} onChange={(e) => updateList(setKpis, kpis, idx, "label", e.target.value)} placeholder="라벨 (예: 원/달러 환율)" className="w-full bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                  <input type="text" value={kpi.value} onChange={(e) => updateList(setKpis, kpis, idx, "value", e.target.value)} placeholder="값 (예: 1,432.10)" className="w-full bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={kpi.change} onChange={(e) => updateList(setKpis, kpis, idx, "change", e.target.value)} placeholder="변동 (예: +4.30원)" className="w-full col-span-1 bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                  <Select value={kpi.statusColor} onValueChange={(val) => updateList(setKpis, kpis, idx, "statusColor", val)}>
                    <SelectTrigger className="h-7 text-[10px] bg-white col-span-1"><SelectValue placeholder="색상" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rose">Rose (상승/위험)</SelectItem><SelectItem value="blue">Blue (하락/안정)</SelectItem><SelectItem value="amber">Amber (주의)</SelectItem><SelectItem value="slate">Slate (중립)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <input type="text" value={kpi.status} onChange={(e) => updateList(setKpis, kpis, idx, "status", e.target.value)} placeholder="상태 요약 (예: rose 상승: 달러 가치가 살짝 오르며...)" className="w-full bg-white rounded-md py-1.5 px-2 text-[11px] font-medium border" />
              </div>
            ))}
          </div>
        </section>

        {/* 4. 마켓 인덱스 보드 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[12px] font-black text-slate-800 flex items-center gap-1"><Activity className="w-4 h-4 text-emerald-500" /> 마켓 지표 로그</p>
            <button onClick={() => setMarkets([...markets, { name: "", val: "", change: "", status: "" }])} className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full"><Plus className="w-3 h-3 inline" /> 추가</button>
          </div>
          <div className="space-y-3">
            {markets.map((mkt, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative space-y-2">
                <button onClick={() => removeList(setMarkets, markets, idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                <div className="flex gap-2 pr-6">
                  <input type="text" value={mkt.name} onChange={(e) => updateList(setMarkets, markets, idx, "name", e.target.value)} placeholder="시장 (예: 코스피)" className="w-1/3 bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                  <input type="text" value={mkt.val} onChange={(e) => updateList(setMarkets, markets, idx, "val", e.target.value)} placeholder="지수 (예: 6,268.75)" className="w-1/3 bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                  <input type="text" value={mkt.change} onChange={(e) => updateList(setMarkets, markets, idx, "change", e.target.value)} placeholder="등락 (예: -0.61%)" className="w-1/3 bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                </div>
                <input type="text" value={mkt.status} onChange={(e) => updateList(setMarkets, markets, idx, "status", e.target.value)} placeholder="마감 요약 코멘트" className="w-full bg-white rounded-md py-1.5 px-2 text-[11px] border" />
              </div>
            ))}
          </div>
        </section>

        {/* 5. 배포 일정 (스케줄) */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[12px] font-black text-slate-800 flex items-center gap-1"><CalendarDays className="w-4 h-4 text-amber-500" /> 패치 배포 일정 (Schedule)</p>
            <button onClick={() => setSchedule([...schedule, { dDay: "D-Day", title: "", description: "", isUrgent: false }])} className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full"><Plus className="w-3 h-3 inline" /> 추가</button>
          </div>
          <div className="space-y-3">
            {schedule.map((sch, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative space-y-2">
                <button onClick={() => removeList(setSchedule, schedule, idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                <div className="flex items-center gap-2 pr-6">
                  <input type="text" value={sch.dDay} onChange={(e) => updateList(setSchedule, schedule, idx, "dDay", e.target.value)} placeholder="D-Day" className="w-20 bg-white rounded-md py-1.5 px-2 text-[11px] font-bold border" />
                  <label className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                    <input type="checkbox" checked={sch.isUrgent} onChange={(e) => updateList(setSchedule, schedule, idx, "isUrgent", e.target.checked)} /> 긴급(Urgent)
                  </label>
                </div>
                <input type="text" value={sch.title} onChange={(e) => updateList(setSchedule, schedule, idx, "title", e.target.value)} placeholder="일정 제목 (예: 미국 1월 PPI 발표)" className="w-full bg-white rounded-md py-1.5 px-2 text-[12px] font-bold border" />
                <input type="text" value={sch.description} onChange={(e) => updateList(setSchedule, schedule, idx, "description", e.target.value)} placeholder="일정 설명" className="w-full bg-white rounded-md py-1.5 px-2 text-[11px] border" />
              </div>
            ))}
          </div>
        </section>

        {/* 6. 뉴스 아이템 리스트 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[12px] font-black text-slate-800 flex items-center gap-1"><Newspaper className="w-4 h-4 text-teal-500" /> 개별 뉴스 항목</p>
            <button onClick={() => setNewsItems([...newsItems, { stars: 4, cat: "Tech", color: "blue", title: "", summary: "", insight: "", link: "" }])} className="text-[10px] font-bold text-teal-500 bg-teal-50 px-2 py-1 rounded-full"><Plus className="w-3 h-3 inline" /> 뉴스 추가</button>
          </div>
          <div className="space-y-4">
            {newsItems.map((news, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative">
                <button onClick={() => removeList(setNewsItems, newsItems, idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                <div className="grid grid-cols-3 gap-2 mb-3 pr-6">
                  <Select value={news.cat} onValueChange={(val) => updateList(setNewsItems, newsItems, idx, "cat", val)}><SelectTrigger className="h-8 text-[11px] font-bold bg-white"><SelectValue placeholder="카테고리" /></SelectTrigger><SelectContent>{["Eco", "Tech", "Bio", "Policy", "Market"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <Select value={news.color} onValueChange={(val) => updateList(setNewsItems, newsItems, idx, "color", val)}><SelectTrigger className="h-8 text-[11px] font-bold bg-white"><SelectValue placeholder="컬러" /></SelectTrigger><SelectContent><SelectItem value="blue">Blue</SelectItem><SelectItem value="emerald">Emerald</SelectItem><SelectItem value="slate">Slate</SelectItem></SelectContent></Select>
                  <input type="number" min="1" max="5" value={news.stars} onChange={(e) => updateList(setNewsItems, newsItems, idx, "stars", Number(e.target.value))} placeholder="별점" className="w-full h-8 px-2 text-[11px] font-bold bg-white rounded-md border" />
                </div>
                <div className="space-y-2">
                  <input type="text" value={news.title} onChange={(e) => updateList(setNewsItems, newsItems, idx, "title", e.target.value)} placeholder="뉴스 제목" className="w-full bg-white rounded-md py-2 px-3 text-[13px] font-bold border" />
                  <textarea value={news.summary} onChange={(e) => updateList(setNewsItems, newsItems, idx, "summary", e.target.value)} placeholder="뉴스 요약 (생략 가능)" rows={2} className="w-full bg-white rounded-md py-2 px-3 text-[12px] border resize-none" />
                  <textarea value={news.insight} onChange={(e) => updateList(setNewsItems, newsItems, idx, "insight", e.target.value)} placeholder="기획자 인사이트 (Planner's Insight)" rows={2} className="w-full bg-indigo-50/50 rounded-md py-2 px-3 text-[12px] font-medium border border-indigo-100 text-indigo-900 resize-none" />
                  <input type="url" value={news.link} onChange={(e) => updateList(setNewsItems, newsItems, idx, "link", e.target.value)} placeholder="원문 링크 URL (선택)" className="w-full bg-white rounded-md py-1.5 px-3 text-[11px] text-blue-500 border" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 총평 (Executive Summary) */}
        <section className="bg-slate-900 rounded-[24px] shadow-sm p-5 space-y-3">
          <p className="text-[12px] font-black text-white flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Executive Summary (총평)</p>
          <textarea value={summaryData.summary} onChange={(e) => setSummaryData({...summaryData, summary: e.target.value})} placeholder="오늘 브리핑의 핵심 요약을 적어주세요." rows={3} className="w-full bg-slate-800 rounded-xl py-3 px-4 text-[13px] text-white border border-slate-700 resize-none placeholder:text-slate-500" />
          <div className="flex gap-2">
            <input type="text" value={summaryData.quote} onChange={(e) => setSummaryData({...summaryData, quote: e.target.value})} placeholder="명언이나 핵심 문구 (Quote)" className="flex-1 bg-slate-800 rounded-xl py-2 px-3 text-[12px] text-white border border-slate-700 placeholder:text-slate-500" />
            <input type="text" value={summaryData.author} onChange={(e) => setSummaryData({...summaryData, author: e.target.value})} placeholder="작성자" className="w-24 bg-slate-800 rounded-xl py-2 px-3 text-[12px] text-white text-center border border-slate-700 placeholder:text-slate-500" />
          </div>
        </section>

      </main>
    </div>
  )
}