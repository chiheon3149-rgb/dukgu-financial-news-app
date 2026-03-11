"use client"

import Link from "next/link"
import { NoticeDropdown } from "@/components/dukgu/notice-dropdown"
import { useUser } from "@/context/user-context"

// 레벨별 색상 팔레트
const LEVEL_COLORS: Record<number, {
  avatarBg: string; avatarBorder: string; avatarRing: string
  badgeBg: string; badgeBorder: string; badgeText: string
}> = {
  1: { avatarBg: "bg-emerald-50", avatarBorder: "border-emerald-200", avatarRing: "ring-emerald-100", badgeBg: "bg-emerald-50", badgeBorder: "border-emerald-200", badgeText: "text-emerald-700" },
  2: { avatarBg: "bg-blue-50",    avatarBorder: "border-blue-200",    avatarRing: "ring-blue-100",    badgeBg: "bg-blue-50",    badgeBorder: "border-blue-200",    badgeText: "text-blue-700" },
  3: { avatarBg: "bg-indigo-50",  avatarBorder: "border-indigo-200",  avatarRing: "ring-indigo-100",  badgeBg: "bg-indigo-50",  badgeBorder: "border-indigo-200",  badgeText: "text-indigo-700" },
  4: { avatarBg: "bg-amber-50",   avatarBorder: "border-amber-200",   avatarRing: "ring-amber-100",   badgeBg: "bg-amber-50",   badgeBorder: "border-amber-200",   badgeText: "text-amber-700" },
  5: { avatarBg: "bg-orange-50",  avatarBorder: "border-orange-200",  avatarRing: "ring-orange-100",  badgeBg: "bg-orange-50",  badgeBorder: "border-orange-200",  badgeText: "text-orange-700" },
  6: { avatarBg: "bg-yellow-50",  avatarBorder: "border-yellow-300",  avatarRing: "ring-yellow-200",  badgeBg: "bg-yellow-50",  badgeBorder: "border-yellow-300",  badgeText: "text-yellow-700" },
}

export function StickyHeader() {
  const { profile, currentLevel, isLoading } = useUser()
  const colors = LEVEL_COLORS[currentLevel.level] ?? LEVEL_COLORS[1]

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">

        <Link href="/">
          <h1 className="text-[17px] font-extrabold tracking-tight text-foreground cursor-pointer leading-tight">
            덕구의 뉴스 곳간
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          <NoticeDropdown />

          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              <div className="w-14 h-5 rounded-full bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <Link
              href="/mypage"
              className="flex items-center gap-2 hover:opacity-80 active:scale-95 transition-all"
            >
              <div className={`w-8 h-8 rounded-full ${colors.avatarBg} border-2 ${colors.avatarBorder} flex items-center justify-center text-lg ring-2 ${colors.avatarRing}`}>
                {profile?.avatarEmoji ?? "🐱"}
              </div>
              <span className={`text-xs font-black ${colors.badgeText} ${colors.badgeBg} px-2 py-0.5 rounded-full border ${colors.badgeBorder}`}>
                {currentLevel.icon} Lv.{currentLevel.level}
              </span>
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
