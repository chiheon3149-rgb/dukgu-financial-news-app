"use client"

import Link from "next/link"
import { NoticeDropdown } from "@/components/dukgu/notice-dropdown"
import { useUser } from "@/context/user-context"

const LEVEL_COLORS: Record<number, {
  badgeBg: string; badgeBorder: string; badgeText: string
}> = {
  1: { badgeBg: "bg-emerald-50", badgeBorder: "border-emerald-200", badgeText: "text-emerald-700" },
  2: { badgeBg: "bg-blue-50",    badgeBorder: "border-blue-200",    badgeText: "text-blue-700" },
  3: { badgeBg: "bg-indigo-50",  badgeBorder: "border-indigo-200",  badgeText: "text-indigo-700" },
  4: { badgeBg: "bg-amber-50",   badgeBorder: "border-amber-200",   badgeText: "text-amber-700" },
  5: { badgeBg: "bg-orange-50",  badgeBorder: "border-orange-200",  badgeText: "text-orange-700" },
  6: { badgeBg: "bg-yellow-50",  badgeBorder: "border-yellow-300",  badgeText: "text-yellow-700" },
}

export function StickyHeader() {
  const { profile, currentLevel, isLoading } = useUser()
  const colors = LEVEL_COLORS[currentLevel.level] ?? LEVEL_COLORS[1]

  return (
    <header className="sticky top-0 z-50 bg-[#F9FAFB]">
      <div className="flex items-center justify-between px-4 max-w-[420px] mx-auto h-16">

        <Link href="/">
          <span className="text-[18px] font-bold text-[#111827] tracking-tight">
            Dukgu News
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NoticeDropdown />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
          ) : (
            <Link
              href="/mypage"
              className="hover:opacity-80 active:scale-95 transition-all"
            >
              <div className={`w-8 h-8 rounded-full ${colors.badgeBg} border-2 ${colors.badgeBorder} flex items-center justify-center text-lg`}>
                {profile?.avatarEmoji ?? "🐱"}
              </div>
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
