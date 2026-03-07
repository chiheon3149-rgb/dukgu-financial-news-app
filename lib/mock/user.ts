import type { LevelMeta } from "@/types"

// =============================================================================
// 🏆 레벨 정의 테이블
// =============================================================================

export const LEVEL_TABLE: LevelMeta[] = [
  { level: 1, title: "새싹 투자자",     minXp: 0,    maxXp: 100,  icon: "🌱" },
  { level: 2, title: "견습 분석가",     minXp: 100,  maxXp: 250,  icon: "📊" },
  { level: 3, title: "주니어 트레이더", minXp: 250,  maxXp: 500,  icon: "📈" },
  { level: 4, title: "시니어 투자자",   minXp: 500,  maxXp: 900,  icon: "💼" },
  { level: 5, title: "포트폴리오 마스터", minXp: 900, maxXp: 1500, icon: "🏆" },
  { level: 6, title: "월스트리트 레전드", minXp: 1500, maxXp: 9999, icon: "👑" },
]

/** 누적 XP로 현재 레벨 메타를 계산합니다 */
export function getLevelMeta(totalXp: number): LevelMeta {
  return (
    [...LEVEL_TABLE].reverse().find((l) => totalXp >= l.minXp) ?? LEVEL_TABLE[0]
  )
}
