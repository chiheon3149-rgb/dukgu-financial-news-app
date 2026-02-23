"use client"

import Link from "next/link"
import { NoticeDropdown } from "@/components/dukgu/notice-dropdown"
import { useUser } from "@/context/user-context"
import { XpLevelBadge } from "@/components/dukgu/xp-level-badge"

export function StickyHeader() {
  const { profile, currentLevel } = useUser()

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">

        <Link href="/">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground cursor-pointer">
            DUKGU
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          <NoticeDropdown />

          <Link
            href="/mypage"
            className="flex items-center gap-2 hover:opacity-80 active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-lg ring-2 ring-primary/10">
              {profile?.avatarEmoji ?? "🐱"}
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {currentLevel.icon} Lv.{currentLevel.level}
            </span>
          </Link>
        </div>

      </div>
    </header>
  )
}
