"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { BookMarked, ThumbsUp, ThumbsDown, Zap, ArrowLeft } from "lucide-react"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useUser } from "@/context/user-context"

// =============================================================================
// 🔖 /mypage/saved — 저장/반응/XP 통합 페이지 (탭 전환)
// URL 쿼리 ?tab=reactions 또는 ?tab=xp 로 탭을 전환합니다.
// =============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  "경제": "bg-accent/15 text-slate-700",
  "정치": "bg-primary/10 text-slate-700",
  "사회": "bg-chart-4/15 text-slate-700",
  "문화": "bg-chart-1/15 text-slate-700",
}

const XP_SOURCE_LABELS: Record<string, string> = {
  quiz_correct: "퀴즈 정답",
  quiz_bonus: "퀴즈 보너스",
  daily_login: "출석 체크",
  admin: "관리자 지급",
}

function SavedContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") ?? "saved"
  const { savedArticles, reactions } = useSavedArticles()
  const { profile } = useUser()

  const tabs = [
    { key: "saved",     label: "북마크",    icon: <BookMarked className="w-3.5 h-3.5" />, count: savedArticles.length },
    { key: "reactions", label: "내 반응",   icon: <ThumbsUp className="w-3.5 h-3.5" />,   count: reactions.length },
    { key: "xp",        label: "XP 내역",  icon: <Zap className="w-3.5 h-3.5" />,          count: profile?.xpHistory.length ?? 0 },
  ]

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/mypage" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <span className="text-[16px] font-black text-slate-900">내 활동 내역</span>
        </div>

        {/* 탭 */}
        <div className="max-w-md mx-auto px-5 pb-3 flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/mypage/saved${t.key === "saved" ? "" : `?tab=${t.key}`}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all ${
                tab === t.key
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] font-black px-1 rounded-full ${
                  tab === t.key ? "bg-white/30 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-5 space-y-3">

        {/* 탭: 북마크 */}
        {tab === "saved" && (
          savedArticles.length === 0 ? (
            <EmptyState icon={<BookMarked className="w-10 h-10 opacity-20" />} message="저장한 기사가 없습니다" />
          ) : (
            savedArticles.map((article) => (
              <Link key={article.newsId} href={`/news/${article.newsId}`}
                className="block bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 hover:border-blue-200 transition-all active:scale-[0.98] group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.snapshot.category] ?? "bg-slate-100 text-slate-600"}`}>
                        {article.snapshot.category}
                      </span>
                      {article.snapshot.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-blue-500">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[14px] font-black text-slate-800 leading-snug">{article.snapshot.headline}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {new Date(article.savedAt).toLocaleDateString("ko-KR")} 저장
                    </p>
                  </div>
                  <BookMarked className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                </div>
              </Link>
            ))
          )
        )}

        {/* 탭: 반응 */}
        {tab === "reactions" && (
          reactions.length === 0 ? (
            <EmptyState icon={<ThumbsUp className="w-10 h-10 opacity-20" />} message="반응한 기사가 없습니다" />
          ) : (
            reactions.filter((r) => r.snapshot).map((r) => (
              <Link key={r.newsId} href={`/news/${r.newsId}`}
                className="block bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 hover:border-emerald-200 transition-all active:scale-[0.98]">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${r.type === "like" ? "bg-blue-50" : "bg-rose-50"}`}>
                    {r.type === "like"
                      ? <ThumbsUp className="w-4 h-4 text-blue-500 fill-blue-500" />
                      : <ThumbsDown className="w-4 h-4 text-rose-500 fill-rose-500" />}
                  </div>
                  <div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mr-1.5 ${
                      CATEGORY_COLORS[r.snapshot?.category ?? ""] ?? "bg-slate-100 text-slate-600"
                    }`}>{r.snapshot?.category}</span>
                    <p className="text-[14px] font-black text-slate-800 leading-snug mt-1">{r.snapshot?.headline}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {new Date(r.reactedAt).toLocaleDateString("ko-KR")} · {r.type === "like" ? "좋아요" : "싫어요"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )
        )}

        {/* 탭: XP 내역 */}
        {tab === "xp" && (
          !profile?.xpHistory.length ? (
            <EmptyState icon={<Zap className="w-10 h-10 opacity-20" />} message="XP 획득 내역이 없습니다" />
          ) : (
            profile!.xpHistory.map((event) => (
              <div key={event.id}
                className="flex items-center justify-between bg-white rounded-[20px] border border-slate-100 shadow-sm px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">{event.label}</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {XP_SOURCE_LABELS[event.source] ?? event.source} · {new Date(event.earnedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <span className="text-[13px] font-black text-amber-500">+{event.amount} XP</span>
              </div>
            ))
          )
        )}

      </main>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-slate-300">
      {icon}
      <p className="text-sm font-bold mt-3">{message}</p>
    </div>
  )
}

export default function SavedPage() {
  return (
    <Suspense>
      <SavedContent />
    </Suspense>
  )
}
