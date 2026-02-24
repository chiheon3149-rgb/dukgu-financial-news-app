"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Users } from "lucide-react"
import { useFollow } from "@/hooks/use-follow"

export default function FollowPage() {
  const router = useRouter()
  const { following, followers } = useFollow()
  const [tab, setTab] = useState<"following" | "followers">("following")

  const list = tab === "following" ? following : followers

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-[16px] font-black text-slate-900">팔로잉 / 팔로워</span>
        </div>

        {/* 탭 */}
        <div className="max-w-md mx-auto px-5 pb-3 flex gap-2">
          {(["following", "followers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t === "following"
                ? `팔로잉 ${following.length}`
                : `팔로워 ${followers.length}`}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-4">
        {list.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-300">
            <Users className="w-10 h-10 opacity-20" />
            <p className="text-sm font-bold mt-3">
              {tab === "following" ? "팔로우 중인 유저가 없습니다" : "팔로워가 없습니다"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((rel) => {
              const profileId = tab === "following" ? rel.followingId : rel.followerId
              return (
                <Link
                  key={rel.followerId + rel.followingId}
                  href={`/profile/${profileId}`}
                  className="flex items-center gap-3 bg-white rounded-[20px] border border-slate-100 shadow-sm px-4 py-3.5 hover:border-emerald-200 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shrink-0">
                    {rel.targetEmoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-black text-slate-800">{rel.targetNickname}</p>
                    <p className="text-[10px] font-bold text-slate-400">Lv.{rel.targetLevel}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">프로필 →</span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
