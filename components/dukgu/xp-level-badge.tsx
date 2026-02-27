"use client"

import type { LevelMeta } from "@/types"

// =============================================================================
// 🏆 XpLevelBadge (수리 완료!)
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
  totalXp = 0, // 기본값 처리
  progress = 0, // 기본값 처리
  size = "lg",
}: XpLevelBadgeProps) {
  const isMaxLevel = !nextLevel

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-base">{currentLevel?.icon || "🥚"}</span>
        <span className="text-[11px] font-black text-slate-600">Lv.{currentLevel?.level || 1}</span>
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
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
          <span className="text-2xl">{currentLevel?.icon || "🥚"}</span>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Level {currentLevel?.level || 1}
            </p>
            <p className="text-[15px] font-black text-slate-800">{currentLevel?.title || "알 수 없음"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black text-emerald-500">{(totalXp || 0).toLocaleString()} XP</p>
          {!isMaxLevel && nextLevel && (
            <p className="text-[9px] font-bold text-slate-400">
              다음 레벨까지 {Math.max(0, nextLevel.minXp - (totalXp || 0)).toLocaleString()} XP
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
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {/* 진행률 퍼센트 */}
        <p className="text-[9px] font-black text-slate-400 mt-1 text-right">
          {isMaxLevel ? "100%" : `${Math.floor(progress)}%`}
        </p>
      </div>
    </div>
  )
}