"use client"

import { useState } from "react"
import { MessageCircle, ThumbsUp, ThumbsDown, Bookmark } from "lucide-react"

type CategoryType = "\uC815\uCE58" | "\uACBD\uC81C" | "\uC0AC\uD68C" | "\uAD6D\uC81C" | "\uAE30\uC5C5" | "\uBD80\uB3D9\uC0B0"

const categoryStyles: Record<CategoryType, string> = {
  "\uC815\uCE58": "bg-primary/10 text-primary border-primary/20",
  "\uACBD\uC81C": "bg-accent/15 text-accent-foreground border-accent/25",
  "\uC0AC\uD68C": "bg-chart-4/15 text-chart-4 border-chart-4/25",
  "\uAD6D\uC81C": "bg-chart-1/15 text-chart-1 border-chart-1/25",
  "\uAE30\uC5C5": "bg-chart-2/15 text-chart-2 border-chart-2/25",
  "\uBD80\uB3D9\uC0B0": "bg-destructive/10 text-destructive border-destructive/20",
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
}

export function NewsCard({
  category,
  headline,
  summary,
  timeAgo,
  goodCount: initialGood,
  badCount: initialBad,
  commentCount,
  saved: initialSaved = false,
}: NewsCardProps) {
  const [reaction, setReaction] = useState<"good" | "bad" | null>(null)
  const [goodCount, setGoodCount] = useState(initialGood)
  const [badCount, setBadCount] = useState(initialBad)
  const [isSaved, setIsSaved] = useState(initialSaved)

  const handleGood = () => {
    if (reaction === "good") {
      setReaction(null)
      setGoodCount((c) => c - 1)
    } else {
      if (reaction === "bad") setBadCount((c) => c - 1)
      setReaction("good")
      setGoodCount((c) => c + 1)
    }
  }

  const handleBad = () => {
    if (reaction === "bad") {
      setReaction(null)
      setBadCount((c) => c - 1)
    } else {
      if (reaction === "good") setGoodCount((c) => c - 1)
      setReaction("bad")
      setBadCount((c) => c + 1)
    }
  }

  return (
    <article className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyles[category]}`}
        >
          {category}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          {timeAgo}
        </span>
      </div>

      <h3 className="text-[15px] font-bold text-card-foreground leading-snug mb-1.5 text-pretty">
        {headline}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-1">
        {summary}
      </p>

      {/* Interaction Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={handleGood}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              reaction === "good"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            aria-label={"\uC88B\uC544\uC694"}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "good" ? "fill-primary" : ""}`} />
            <span>{goodCount}</span>
          </button>

          <button
            onClick={handleBad}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              reaction === "bad"
                ? "bg-destructive/15 text-destructive"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            aria-label={"\uC2EB\uC5B4\uC694"}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "bad" ? "fill-destructive" : ""}`} />
            <span>{badCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors active:scale-95"
            aria-label={"\uB313\uAE00"}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{commentCount}</span>
          </button>

          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-1.5 rounded-full transition-colors active:scale-95 ${
              isSaved
                ? "text-primary"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            aria-label={"\uC800\uC7A5"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  )
}
