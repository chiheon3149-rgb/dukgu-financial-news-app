"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Sparkles, ShieldCheck, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useNewsAdmin } from "@/hooks/use-news-admin"
import { useUser } from "@/context/user-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NewsCategory, NewsMarket } from "@/types"

export default function NewNewsPage() {
  const router = useRouter()
  const { createNews } = useNewsAdmin()
  const { profile, isLoading } = useUser()

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 💡 [보안] 관리자가 아니면 이 페이지에서 쫓아냅니다!
  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      toast.error("관리자(VIP) 전용 공간이다냥! 🐾 출입 금지!")
      router.replace("/") 
    }
  }, [profile, isLoading, router])

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
      const newNews = await createNews({
        category,
        market_classification: market === "common" ? "공통" : market === "kr" ? "한국" : "미국",
        headline: headline.trim(),
        ai_summary: aiSummary.trim() || null,
        body_summary: content.trim(),
        source: source.trim() || "덕구",
        source_url: originalUrl.trim() || null,
        issue_badge: "표시안함",
        tags,
        tickers,
      })

      toast.success("뉴스가 성공적으로 발행되었다냥! 📰🐾")
      router.replace(`/news/${newNews.id}`) // 등록 후 해당 뉴스 상세로 이동
    } catch (error: any) {
      console.error("뉴스 발행 에러:", error.message || error)
      toast.error(`발행 실패: ${error.message || "오류가 발생했다냥"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 관리자 권한 확인 중이거나 아니면 빈 화면 렌더링 (깜빡임 방지)
  if (isLoading || !profile?.is_admin) return null;

  const isValid = headline.trim().length > 0 && content.trim().length > 0

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader
        title="[관리자] 뉴스 발행"
        rightElement={
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all active:scale-95 flex items-center gap-1 ${
              isValid && !isSubmitting
                ? "bg-indigo-600 text-white shadow-sm" // 💡 관리자 느낌을 주기 위해 색상을 다르게!
                : "bg-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSubmitting ? "발행 중..." : "발행"}
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
                if (!summary) setSummary(e.target.value.slice(0, 100)); // 본문을 쓰면 요약본에 자동 일부 채움
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

        {/* 태그 입력 (커뮤니티와 동일) */}
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