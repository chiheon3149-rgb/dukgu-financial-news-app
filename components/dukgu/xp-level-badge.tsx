"use client"

import type { LevelMeta } from "@/types"

// =============================================================================
// 🏆 XpLevelBadge
//
// 마이페이지 상단 프로필 카드에서 사용하는 레벨/XP 표시 컴포넌트입니다.
// 레벨 아이콘, 타이틀, 경험치 게이지 바를 포함합니다.
// =============================================================================

interface XpLevelBadgeProps {
  currentLevel: LevelMeta
  nextLevel: LevelMeta | null
  totalXp: number
  progress: number // 0~100
  size?: "sm" | "lg"
}

export function XpLevelBadge({
  currentLevel,
  nextLevel,
  totalXp,
  progress,
  size = "lg",
}: XpLevelBadgeProps) {
  const isMaxLevel = !nextLevel

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-base">{currentLevel.icon}</span>
        <span className="text-[11px] font-black text-slate-600">Lv.{currentLevel.level}</span>
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* 레벨 아이콘 + 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentLevel.icon}</span>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Level {currentLevel.level}
            </p>
            <p className="text-[15px] font-black text-slate-800">{currentLevel.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black text-emerald-500">{totalXp.toLocaleString()} XP</p>
          {!isMaxLevel && (
            <p className="text-[9px] font-bold text-slate-400">
              다음 레벨까지 {(nextLevel!.minXp - totalXp).toLocaleString()} XP
            </p>
          )}
          {isMaxLevel && (
            <p className="text-[9px] font-bold text-amber-500">👑 최고 레벨 달성!</p>
          )}
        </div>
      </div>

      {/* 경험치 게이지 바 */}
      <div className="relative">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 진행률 퍼센트 */}
        <p className="text-[9px] font-black text-slate-400 mt-1 text-right">
          {isMaxLevel ? "100%" : `${progress}%`}
        </p>
      </div>
    </div>
  )
}
