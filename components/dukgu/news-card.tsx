"use client"

import { NewsInteractionBar } from "./news-interaction-bar"

const categoryStyles = {
  정치: "text-red-600 bg-red-50",
  // 🍃 경제는 이미 민트네요! 아주 좋습니다.
  경제: "text-emerald-600 bg-emerald-50",
  사회: "text-slate-600 bg-slate-50", // 파랑에서 차분한 그레이로 변경 제안
  문화: "text-purple-600 bg-purple-50",
  IT: "text-indigo-600 bg-indigo-50",
}

interface NewsCardProps {
  id?: string
  category: keyof typeof categoryStyles
  headline: string
  summary: string
  timeAgo: string
  goodCount: number
  badCount: number
  commentCount: number
  tags?: string[]
  source?: string | null
}

export function NewsCard({
  id,
  category,
  headline,
  summary,
  timeAgo,
  goodCount,
  badCount,
  commentCount,
  tags = [],
  source,
}: NewsCardProps) {
  const isDukguPick = source === "덕구"

  return (
    <article className={`rounded-[24px] p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col h-full group border ${
      isDukguPick
        /* 🍃 [변경] 덕구 픽: 블루 배경 -> 민트 배경 */
        ? "bg-emerald-50/50 border-emerald-100" 
        : "bg-white border-slate-100"
    }`}>

      {/* 상단: 카테고리 + [덕구 픽] 뱃지 + 시간 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${categoryStyles[category] || "bg-slate-50 text-slate-500"}`}>
            {category}
          </span>
          {isDukguPick && (
            /* 🍃 [변경] 덕구 픽 뱃지: 블루 -> 민트 */
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white tracking-tight">
              덕구 픽
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          {timeAgo}
        </span>
      </div>

      {/* 본문 영역 */}
      {/* 🍃 [변경] 헤드라인 호버: 블루 -> 민트 */}
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-2">
        {headline}
      </h3>

      {/* 🍃 [변경] 태그 색상: 블루 -> 민트 계열 */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="text-[11px] font-bold text-emerald-600/70 tracking-tight">
            {tag.startsWith('#') ? tag : `#${tag}`}
          </span>
        ))}
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed mb-4 line-clamp-2 break-keep opacity-90">
        {summary}
      </p>

      <div className="mt-auto pt-2 border-t border-slate-50/50">
        <NewsInteractionBar
          newsId={id}
          initialGood={goodCount}
          initialBad={badCount}
          commentCount={commentCount}
          snapshot={id ? { headline, category, timeAgo, tags } : undefined}
        />
      </div>

    </article>
  )
}