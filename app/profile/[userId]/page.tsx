"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Lock, TrendingUp, TrendingDown, UserPlus, UserMinus } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useFollow } from "@/hooks/use-follow"
import { MOCK_COMMUNITY_USERS } from "@/lib/mock/community"
import { LEVEL_TABLE } from "@/lib/mock/user"

// =============================================================================
// 👤 /profile/[userId] — 상대방 공개 프로필
//
// 팔로우 중이고, 상대가 portfolioPublic: true일 때만 포트폴리오 표시
// =============================================================================

// Mock 포트폴리오 데이터 (portfolioPublic: true인 유저용)
const MOCK_PUBLIC_PORTFOLIOS: Record<string, { ticker: string; name: string; returnRate: number }[]> = {
  "user-002": [
    { ticker: "NVDA", name: "엔비디아", returnRate: 42.5 },
    { ticker: "AAPL", name: "애플",     returnRate: 8.3 },
    { ticker: "QQQ",  name: "인베스코 QQQ", returnRate: 15.1 },
  ],
  "user-004": [
    { ticker: "QYLD", name: "글로벌X 나스닥 커버드콜", returnRate: 3.2 },
    { ticker: "SCHD", name: "슈왑 배당주",             returnRate: 11.8 },
  ],
}

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const { isFollowing, toggleFollow } = useFollow()

  const targetUser = MOCK_COMMUNITY_USERS.find((u) => u.id === params.userId)
  const levelMeta = useMemo(
    () => LEVEL_TABLE.find((l) => l.level === (targetUser?.level ?? 1)) ?? LEVEL_TABLE[0],
    [targetUser?.level]
  )

  const following = isFollowing(params.userId)
  const canViewPortfolio = following && (targetUser?.portfolioPublic ?? false)
  const portfolio = MOCK_PUBLIC_PORTFOLIOS[params.userId] ?? []

  if (!targetUser) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          유저를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader title="프로필" />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 프로필 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[20px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl">
                {targetUser.emoji}
              </div>
              <div>
                <p className="text-[18px] font-black text-slate-900">{targetUser.nickname}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px]">{levelMeta.icon}</span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Lv.{targetUser.level} {levelMeta.title}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {targetUser.joinedAt} 가입
                </p>
              </div>
            </div>

            {/* 팔로우 버튼 */}
            <button
              onClick={() => toggleFollow({ id: targetUser.id, nickname: targetUser.nickname, emoji: targetUser.emoji, level: targetUser.level })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-black transition-all active:scale-95 ${
                following
                  ? "bg-slate-100 text-slate-500 border border-slate-200"
                  : "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
              }`}
            >
              {following ? (
                <><UserMinus className="w-3.5 h-3.5" /> 팔로잉</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> 팔로우</>
              )}
            </button>
          </div>
        </section>

        {/* 포트폴리오 섹션 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                포트폴리오
              </p>
              {!targetUser.portfolioPublic && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-bold">비공개</span>
                </div>
              )}
            </div>
          </div>

          {canViewPortfolio ? (
            <div className="px-5 py-4 space-y-3">
              {portfolio.map((item) => (
                <div key={item.ticker} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-[13px] font-black text-slate-800">{item.ticker}</p>
                    <p className="text-[11px] font-bold text-slate-400">{item.name}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-black ${
                    item.returnRate >= 0 ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                  }`}>
                    {item.returnRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.returnRate >= 0 ? "+" : ""}{item.returnRate}%
                  </div>
                </div>
              ))}
              {portfolio.length === 0 && (
                <p className="text-[12px] font-bold text-slate-400 py-4 text-center">
                  보유 종목이 없습니다.
                </p>
              )}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-slate-300">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-[12px] font-bold">
                {!following
                  ? "팔로우하면 공개 포트폴리오를 볼 수 있어요"
                  : "이 유저는 포트폴리오를 비공개로 설정했습니다"}
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
