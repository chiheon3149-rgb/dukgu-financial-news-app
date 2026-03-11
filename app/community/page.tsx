"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PenSquare, Users, Loader2, RefreshCw } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { CommunityPostCard } from "@/components/dukgu/community-post-card"
import { SearchBar } from "@/components/dukgu/search-bar"
import { AdBanner } from "@/components/dukgu/ad-banner"
import { VoteCard } from "@/components/dukgu/vote-card"
import { useCommunity } from "@/hooks/use-community"
import { useUser } from "@/context/user-context"
import type { CommunityPost, CommunityCategory } from "@/types"
import { toast } from "sonner" 

// 💡 [수정] 스포츠를 제외하고 기존 카테고리만 유지합니다.
const TABS: { id: CommunityCategory | "all"; label: string }[] = [
  { id: "all",     label: "전체" },
  { id: "free",    label: "자유" },
  { id: "economy", label: "경제" },
]

export default function CommunityPage() {
  const router = useRouter()
  
  const {
    filteredPosts,
    isLoading,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    reactPost,
    deletePost,
    fetchPosts,
    userReactions,
  } = useCommunity()
  
  const { profile } = useUser()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return
    setIsRefreshing(true)
    try {
      if (fetchPosts) {
        await fetchPosts()
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
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
        {/* 0. 눈치게임 투표 */}
        <VoteCard />

        {/* 1. 카테고리 탭 메뉴 */}
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

        {/* 2. 서치바 & 새로고침 버튼 */}
        <section className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex-1">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="제목, 내용, 작성자 검색"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex-shrink-0 bg-white border border-slate-200 text-slate-500 hover:text-emerald-500 hover:border-emerald-300 rounded-xl transition-all active:scale-95 disabled:opacity-50 h-[44px] w-[44px] flex items-center justify-center mb-1 shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </section>

        {/* 3. 게시글 리스트 */}
        <div className="space-y-3">
          {isLoading && !isRefreshing && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.07)] space-y-3">
                  {/* 작성자 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-20 bg-slate-100 rounded-full animate-pulse" />
                      <div className="h-2 w-14 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                  {/* 본문 */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-3 w-full bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  {/* 반응 */}
                  <div className="flex gap-4 pt-1">
                    <div className="h-3 w-12 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-3 w-12 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredPosts.map((post: CommunityPost, index: number) => {
            const isEverySeven = (index + 1) % 7 === 0;
            const isLastButNotSeven = (index === filteredPosts.length - 1) && ((index + 1) % 7 !== 0);
            
            return (
              <div key={post.id} className="space-y-3">
                <CommunityPostCard
                  post={post}
                  onReact={reactPost}
                  onDelete={deletePost}
                  currentUserId={profile?.id}
                  initialReaction={profile?.id ? (userReactions[post.id] ?? null) : null}
                  onProfileClick={(authorId: string) => router.push(`/profile/${authorId}`)}
                />
                
                {/* 광고 노출 로직 */}
                {(isEverySeven || isLastButNotSeven) && (
                  <div className="py-2 animate-in fade-in zoom-in-95 duration-500">
                    <AdBanner />
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">찾으시는 게시글이 없다냥 🐾</p>
            </div>
          )}
        </div>
      </main>

      {/* 우측 하단 플로팅 글쓰기 버튼 - 로그인 체크 유지 */}
      <button
        onClick={() => {
          if (!profile) {
            toast("로그인이 필요한 기능이다냥! 🐾", {
              description: "글을 작성하려면 덕구네 식구가 되어 달라냥.",
              action: {
                label: "로그인하기", 
                onClick: () => router.push("/login"),
              },
            })
            return
          }
          router.push("/community/new")
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 z-40"
      >
        <PenSquare className="w-6 h-6" />
      </button>
    </div>
  )
}