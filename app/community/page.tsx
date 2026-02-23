"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, PenSquare, Users, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { CommunityPostCard } from "@/components/dukgu/community-post-card"
import { useCommunity } from "@/hooks/use-community"
import { useUser } from "@/context/user-context"
import type { CommunityCategory } from "@/types"

const TABS: { id: CommunityCategory | "all"; label: string }[] = [
  { id: "all",     label: "전체" },
  { id: "free",    label: "자유" },
  { id: "economy", label: "경제" },
]

export default function CommunityPage() {
  const router = useRouter()
  const { filteredPosts, isLoading, activeCategory, setActiveCategory, searchQuery, setSearchQuery, reactPost, deletePost } = useCommunity()
  const { profile } = useUser()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">커뮤니티</span>
          </div>
        }
        rightElement={
          <button
            onClick={() => setIsSearchOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Search className="w-4.5 h-4.5 text-slate-500" />
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">

        {/* 검색창 */}
        {isSearchOpen && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용, #태그, 작성자 검색"
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-[13px] focus:outline-none focus:border-emerald-300 transition-all font-medium"
            />
          </div>
        )}

        {/* 카테고리 탭 */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as CommunityCategory | "all")}
              className={`px-4 py-2 rounded-full text-[12px] font-black transition-all active:scale-95 ${
                activeCategory === tab.id
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                  : "bg-white text-slate-500 border border-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* 게시글 수 */}
          <span className="ml-auto text-[11px] font-bold text-slate-400 self-center">
            {filteredPosts.length}개
          </span>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-slate-300">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!isLoading && filteredPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onReact={reactPost}
              onDelete={deletePost}
              currentUserId={profile?.id}
              onProfileClick={(authorId) => router.push(`/profile/${authorId}`)}
            />
          ))}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">게시글이 없습니다</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mt-2 text-[11px] font-bold text-emerald-500">
                  검색 초기화
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 글쓰기 FAB */}
      <button
        onClick={() => router.push("/community/new")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-300 flex items-center justify-center transition-all active:scale-90 hover:bg-emerald-600 z-40"
      >
        <PenSquare className="w-6 h-6" />
      </button>
    </div>
  )
}
