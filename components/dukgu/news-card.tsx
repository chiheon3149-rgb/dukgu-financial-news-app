"use client"

// 💡 상태 관리 로직(useState)과 아이콘 수입이 싹 사라졌습니다!
import { NewsInteractionBar } from "./news-interaction-bar" // 방금 만든 부품 수입

type CategoryType = "정치" | "경제" | "사회" | "문화"

const categoryStyles: Record<CategoryType, string> = {
  "정치": "bg-primary/10 text-primary border-primary/20",
  "경제": "bg-accent/15 text-accent-foreground border-accent/25",
  "사회": "bg-chart-4/15 text-chart-4 border-chart-4/25",
  "문화": "bg-chart-1/15 text-chart-1 border-chart-1/25",
}

interface NewsCardProps {
  category: CategoryType
  headline: string
  summary: string
  timeAgo: string
  goodCount: number
  badCount: number
  commentCount: number
  saved?: boolean
  tags?: string[] 
}

export function NewsCard({
  category,
  headline,
  summary,
  timeAgo,
  goodCount,
  badCount,
  commentCount,
  saved,
  tags = [],
}: NewsCardProps) {
  
  // 💡 복잡했던 좋아요/싫어요 계산 로직이 전부 증발했습니다! 코드가 엄청 깔끔해졌죠.

  return (
    <article className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
      
      {/* 상단: 카테고리 + 태그 + 시간 */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyles[category]}`}>
            {category}
          </span>
          <div className="flex items-center gap-1">
            {tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] font-bold text-blue-500 tracking-tight">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          {timeAgo}
        </span>
      </div>

      {/* 본문 영역 */}
      <h3 className="text-[15px] font-bold text-card-foreground leading-snug mb-1.5 text-pretty">
        {headline}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {summary}
      </p>

      {/* 💡 하단 영역: 길고 긴 버튼 코드 대신, 딱 한 줄로 부품을 끼워 넣습니다. */}
      <NewsInteractionBar 
        initialGood={goodCount} 
        initialBad={badCount} 
        commentCount={commentCount} 
        initialSaved={saved} 
      />
      
    </article>
  )
}