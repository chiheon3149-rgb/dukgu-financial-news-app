"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { X, Plus, Sparkles, ShieldCheck, Loader2, Lightbulb, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useNewsAdmin } from "@/hooks/use-news-admin"
import { useUser } from "@/context/user-context"
import { supabase } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NewsCategory, NewsMarket } from "@/types"

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>() 
  const newsId = params.id

  const { updateNews } = useNewsAdmin()
  const { profile, isLoading: isUserLoading } = useUser()

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 기존 상태들
  const [category, setCategory] = useState<NewsCategory>("경제")
  const [market, setMarket] = useState<NewsMarket>("common")
  const [headline, setHeadline] = useState("")
  const [summary, setSummary] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [content, setContent] = useState("")
  const [source, setSource] = useState("덕구")
  const [originalUrl, setOriginalUrl] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tickers, setTickers] = useState<string[]>([])
  const [tickerInput, setTickerInput] = useState("")

  // 💡 [기획 추가] 뱃지 커스텀을 위한 새로운 상태
  const [impactType, setImpactType] = useState<"hot" | "cold" | "neutral" | "none">("none")
  const [impactKeyword, setImpactKeyword] = useState("")

  useEffect(() => {
    if (!isUserLoading && (!profile || !profile.is_admin)) {
      toast.error("관리자(VIP) 전용 공간이다냥! 🐾 출입 금지!")
      router.replace("/") 
    }
  }, [profile, isUserLoading, router])

  useEffect(() => {
    if (!newsId) return

    const loadNews = async () => {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("id", newsId)
          .single()

        if (error || !data) {
          toast.error("뉴스를 불러올 수 없다냥 😿")
          router.back()
          return
        }

        setCategory(data.category as NewsCategory)
        // market_classification("공통"/"한국"/"미국") → NewsMarket("common"/"kr"/"us") 변환
        const mc = data.market_classification
        setMarket(mc === "한국" ? "kr" : mc === "미국" ? "us" : "common")
        setHeadline(data.headline || "")
        setSummary("")
        setAiSummary(data.ai_summary || "")
        setContent(data.body_summary || "")
        setSource(data.source || "덕구")
        setOriginalUrl(data.source_url || "")
        setTags(Array.isArray(data.tags) ? data.tags : (data.tags ?? []))
        setTickers(Array.isArray(data.tickers) ? data.tickers : (data.tickers ?? []))

        // 이슈뱃지 — issue_badge: "호재"|"악재"|"중립"|"표시안함"
        const badge = data.issue_badge
        if (badge === "호재") { setImpactType("hot"); setImpactKeyword("") }
        else if (badge === "악재") { setImpactType("cold"); setImpactKeyword("") }
        else if (badge === "중립") { setImpactType("neutral"); setImpactKeyword("") }
        else { setImpactType("none"); setImpactKeyword("") }
      } catch (e) {
        console.error("뉴스 로딩 에러:", e)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadNews()
  }, [newsId, router])

  const addTicker = (ticker: string) => {
    const clean = ticker.replace(/\s/g, "").toUpperCase()
    if (!clean || tickers.includes(clean) || tickers.length >= 5) return
    setTickers((prev) => [...prev, clean])
    setTickerInput("")
  }

  const removeTicker = (ticker: string) => setTickers((prev) => prev.filter((t) => t !== ticker))

  const handleTickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault()
      addTicker(tickerInput)
    }
  }

  const addTag = (tag: string) => {
    const clean = tag.replace(/^#/, "").trim()
    if (!clean || tags.includes(clean) || tags.length >= 5) return
    setTags((prev) => [...prev, clean])
    setTagInput("")
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleSubmit = async () => {
    if (!headline.trim() || !content.trim() || isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const badgeMap: Record<string, string> = { hot: "호재", cold: "악재", neutral: "중립" }
      await updateNews(newsId, {
        category,
        market_classification: market === "common" ? "공통" : market === "kr" ? "한국" : "미국",
        headline: headline.trim(),
        ai_summary: aiSummary.trim() || null,
        body_summary: content.trim(),
        source: source.trim() || null,
        source_url: originalUrl.trim() || null,
        tags,
        tickers,
        issue_badge: impactType === "none" ? "표시안함" : (badgeMap[impactType] ?? "표시안함"),
      })

      toast.success("뉴스가 성공적으로 수정되었다냥! 🛠️🐾")
      router.replace(`/news/${newsId}`)
    } catch (error: any) {
      console.error("뉴스 수정 에러:", error.message || error)
      toast.error(`수정 실패: ${error.message || "오류가 발생했다냥"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isUserLoading || !profile?.is_admin || isLoadingData) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-xs font-bold">기존 뉴스를 가져오고 있다냥...</p>
      </div>
    )
  }

  const isValid = headline.trim().length > 0 && content.trim().length > 0

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader
        title="[관리자] 뉴스 수정"
        rightElement={
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all active:scale-95 flex items-center gap-1 ${
              isValid && !isSubmitting
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSubmitting ? "수정 중..." : "수정 완료"}
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* 카테고리 & 출처 */}
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">카테고리</p>
            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
              <SelectTrigger className="w-full bg-slate-50 border-none rounded-xl font-bold">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {["정치", "경제", "사회", "문화", "IT"].map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">출처 (Source)</p>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="예: 덕구, 블룸버그"
              className="w-full bg-slate-50 rounded-xl py-2 px-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </section>
        </div>

        {/* 증시 분류 */}
        <section className="bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">증시 분류</p>
          <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200/50 gap-0.5">
            {([
              { id: "common", label: "🌐 공통", desc: "양쪽 탭 모두 노출" },
              { id: "kr",     label: "🇰🇷 한국", desc: "한국 증시 탭만" },
              { id: "us",     label: "🇺🇸 미국", desc: "미국 증시 탭만" },
            ] as { id: NewsMarket; label: string; desc: string }[]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMarket(opt.id)}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg text-[11px] font-black transition-all active:scale-95 ${
                  market === opt.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[9px] font-medium mt-0.5 ${market === opt.id ? "text-indigo-400" : "text-slate-300"}`}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 헤드라인 및 링크 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">헤드라인 (제목)</p>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="뉴스 제목을 입력하세요"
              className="w-full bg-slate-50 rounded-xl py-3 px-4 text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">원문 링크 (선택)</p>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-50 rounded-xl py-2 px-4 text-[12px] font-medium text-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </section>

        {/* 요약 및 본문 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> AI 덕구 요약 (선택)
            </p>
            <textarea
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="비전공자도 이해하기 쉽게 비유를 들어서 요약해달라냥!"
              rows={3}
              className="w-full bg-amber-50/50 border border-amber-100 rounded-xl py-3 px-4 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none"
            />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">본문 내용 (또는 피드 표시용 요약)</p>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (!summary) setSummary(e.target.value.slice(0, 100));
              }}
              placeholder="뉴스 본문을 입력하세요"
              rows={8}
              className="w-full bg-slate-50 rounded-xl py-3 px-4 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>
        </section>

        {/* 관련 종목 티커 입력 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <BarChart2 className="w-3 h-3" /> 관련 종목 티커 ({tickers.length}/5)
          </p>
          <p className="text-[10px] text-slate-400 mb-3">예: AAPL, TSLA, 005930 (한국주식 6자리 숫자)</p>
          {tickers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tickers.map((t) => (
                <button
                  key={t}
                  onClick={() => removeTicker(t)}
                  className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-black border border-emerald-100 active:scale-95"
                >
                  {t} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyDown={handleTickerKeyDown}
              placeholder="티커 입력 후 Enter (예: AAPL)"
              maxLength={10}
              disabled={tickers.length >= 5}
              className="w-full bg-slate-50 rounded-xl py-2.5 px-4 pr-10 text-[13px] font-black uppercase focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all disabled:opacity-40"
            />
            <button onClick={() => addTicker(tickerInput)} className="absolute right-3 top-2.5 text-slate-400 hover:text-emerald-500">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 💡 [기획 추가] 수동 FOCUS 뱃지 설정 */}
        <section className="bg-indigo-50/50 rounded-[24px] border border-indigo-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> 이슈 FOCUS 뱃지 설정
            </p>
            
            <div className="flex bg-white p-1 rounded-xl border border-indigo-100 mb-3">
              {[
                { id: "none", label: "표시 안함" },
                { id: "hot", label: "🔥 상승/호재" },
                { id: "cold", label: "🧊 하락/악재" },
                { id: "neutral", label: "💡 중립/이슈" }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setImpactType(type.id as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    impactType === type.id 
                      ? "bg-indigo-500 text-white shadow-sm" 
                      : "text-slate-400 hover:text-indigo-400"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {impactType !== "none" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-bold text-slate-400 mb-1.5 ml-1">주제어 입력 (예: 삼성전자, 국제유가)</p>
                <input
                  type="text"
                  value={impactKeyword}
                  onChange={(e) => setImpactKeyword(e.target.value)}
                  placeholder="뱃지에 들어갈 단어를 입력하세요"
                  className="w-full bg-white border border-indigo-100 rounded-xl py-2 px-3 text-[13px] font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            )}
          </div>
        </section>

        {/* 태그 입력 */}
        <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">태그 ({tags.length}/5)</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-indigo-100 active:scale-95"
                >
                  #{tag} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[13px] text-slate-300">#</span>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              maxLength={20}
              disabled={tags.length >= 5}
              className="w-full bg-slate-50 rounded-xl py-2.5 pl-6 pr-10 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium disabled:opacity-40"
            />
            <button onClick={() => addTag(tagInput)} className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-500">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}