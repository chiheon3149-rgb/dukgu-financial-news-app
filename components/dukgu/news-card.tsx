"use client"

import { NewsInteractionBar } from "./news-interaction-bar"

const categoryStyles = {
  정치: "text-red-600 bg-red-50",
  경제: "text-emerald-600 bg-emerald-50",
  사회: "text-blue-600 bg-blue-50",
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
}: NewsCardProps) {

  return (
    // 💡 여백을 p-4로 다시 최적화하고 가로 길이를 자연스럽게 맞췄습니다.
    <article className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col h-full group">
      
      {/* 상단: 카테고리 + 시간 (태그는 제목 아래로 내려 가독성 확보) */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${categoryStyles[category] || "bg-slate-50 text-slate-500"}`}>
          {category}
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {timeAgo}
        </span>
      </div>

      {/* 본문 영역 */}
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">
        {headline}
      </h3>
      
      {/* 💡 태그를 본문 바로 위에 작게 배치하여 시선 분산을 막음 */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="text-[11px] font-bold text-blue-500/70 tracking-tight">
            {tag.startsWith('#') ? tag : `#${tag}`}
          </span>
        ))}
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed mb-4 line-clamp-2 break-keep opacity-90">
        {summary}
      </p>

      {/* 💡 "이상한 선" 제거 후 인터랙션 바만 깔끔하게 배치 */}
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