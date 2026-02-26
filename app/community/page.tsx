"use client"

import { useRouter } from "next/navigation"
import { PenSquare, Users, Loader2 } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { CommunityPostCard } from "@/components/dukgu/community-post-card"
import { SearchBar } from "@/components/dukgu/search-bar" 
import { AdBanner } from "@/components/dukgu/ad-banner" 
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
      />

      <main className="max-w-md mx-auto px-5 py-5 space-y-5">
        
        {/* 1. 탭 메뉴 */}
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
          <span className="ml-auto text-[11px] font-bold text-slate-400 self-center">
            {filteredPosts.length}개
          </span>
        </div>

        {/* 2. 서치바 */}
        <section className="animate-in fade-in slide-in-from-top-1 duration-300">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="제목, 내용, 작성자 검색"
          />
        </section>

        {/* 💡 [광고] 최상단 고정 광고 */}
        <section>
          <AdBanner />
        </section>

        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-slate-300">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {!isLoading && filteredPosts.map((post: any, index: number) => (
            <div key={post.id} className="space-y-3">
              <CommunityPostCard
                post={post}
                onReact={reactPost}
                onDelete={deletePost}
                currentUserId={profile?.id}
                onProfileClick={(authorId: string) => router.push(`/profile/${authorId}`)}
              />
              
              {/* 💡 [수정된 광고 로직] 
                  상단에 이미 광고가 있으므로, 리스트 안에서는 7번째 글 다음에만 광고를 보여줍니다.
                  글이 7개 미만일 때는 리스트 마지막에 광고를 또 보여주지 않아 피로도를 낮췄습니다.
              */}
              {(index + 1) % 7 === 0 && (
                <div className="py-2 animate-in fade-in duration-500">
                  <AdBanner />
                </div>
              )}
            </div>
          ))}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">게시글이 없습니다</p>
            </div>
          )}
        </div>
      </main>

      {/* 글쓰기 버튼 */}
      <button
        onClick={() => router.push("/community/new")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 z-40"
      >
        <PenSquare className="w-6 h-6" />
      </button>
    </div>
  )
}