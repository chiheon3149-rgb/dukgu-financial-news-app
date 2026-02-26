"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { YoutubePlayer } from "@/components/dukgu/youtube-player" // 👈 플레이어 추가
import { getYoutubeIds } from "@/lib/youtube" // 👈 집게 추가
import { useCommunity } from "@/hooks/use-community"
import { useUser } from "@/context/user-context"
import type { CommunityCategory } from "@/types"

const PRESET_TAGS = ["금리", "주식", "ETF", "환율", "부동산", "코인", "절약", "재테크", "경제", "일상"]

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { posts, isLoading, updatePost } = useCommunity(id)
  const { profile } = useUser()

  const post = posts.find((p) => p.id === id)

  const [category, setCategory] = useState<CommunityCategory>("free")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [previewIds, setPreviewIds] = useState<string[]>([]) // 👈 미리보기용 ID 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 게시글 로드 완료 후 폼 초기화
  useEffect(() => {
    if (post && !initialized) {
      setCategory(post.category)
      setTitle(post.title)
      setContent(post.content)
      setTags(post.tags)
      setInitialized(true)
    }
  }, [post, initialized])

  // 💡 [실시간 로직] 내용(content)이 바뀔 때마다 유튜브 ID를 새로 추출합니다.
  useEffect(() => {
    if (content) {
      setPreviewIds(getYoutubeIds(content))
    } else {
      setPreviewIds([])
    }
  }, [content])

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
    if (!title.trim() || !content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await updatePost(id, { title: title.trim(), content: content.trim(), tags, category })
      router.replace(`/community/${id}`)
    } catch {
      toast.error("수정 중 오류가 발생했습니다.")
      setIsSubmitting(false)
    }
  }

  if (!isLoading && post && profile && post.authorId !== profile.id) {
    router.replace(`/community/${id}`)
    return null
  }

  if (isLoading || !initialized) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="게시글 수정" />
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  const isValid = title.trim().length > 0 && content.trim().length > 0

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader
        title="게시글 수정"
        rightElement={
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all active:scale-95 ${
              isValid && !isSubmitting
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-300"
            }`}
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* 카테고리 선택 */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">카테고리</p>
          <div className="flex gap-2">
            {([["free", "자유"], ["economy", "경제"]] as [CommunityCategory, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setCategory(val)}
                className={`flex-1 py-2.5 rounded-2xl text-[13px] font-black transition-all active:scale-95 ${
                  category === val
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 border border-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 태그 */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
            태그 ({tags.length}/5)
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-100 active:scale-95"
                >
                  #{tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          <div className="relative mb-3">
            <span className="absolute left-3 top-2.5 text-[13px] text-slate-300">#</span>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              maxLength={20}
              disabled={tags.length >= 5}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-6 pr-10 text-[13px] focus:outline-none focus:border-emerald-200 transition-all font-medium disabled:opacity-40"
            />
            <button onClick={() => addTag(tagInput)} className="absolute right-3 top-2.5 text-slate-400 hover:text-emerald-500">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                disabled={tags.length >= 5}
                className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold border border-slate-100 hover:border-emerald-200 hover:text-emerald-600 transition-all active:scale-95 disabled:opacity-30"
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>

        {/* 제목 + 내용 */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">제목</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[14px] font-bold focus:outline-none focus:border-emerald-200 transition-all"
            />
            <p className="text-right text-[10px] font-bold text-slate-300 mt-1">{title.length}/100</p>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">내용</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              rows={8}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[13px] font-medium focus:outline-none focus:border-emerald-200 transition-all resize-none mb-1"
            />
            <p className="text-right text-[10px] font-bold text-slate-300 mt-1 mb-4">{content.length}/2000</p>

            {/* 💡 [추가] 실시간 영상 미리보기 영역 */}
            {previewIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1 h-3 bg-emerald-500 rounded-full" />
                  <p className="text-[11px] font-black text-slate-800">영상 미리보기 ({previewIds.length})</p>
                </div>
                <div className="space-y-4">
                  {previewIds.map((vId) => (
                    <YoutubePlayer key={vId} videoId={vId} />
                  ))}
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400">
                  링크를 지우면 미리보기도 사라진다냥! 🐾
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}