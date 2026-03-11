import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── 카테고리별 뱃지 색상 (카드 & 상세 공용) ────────────────────────────────
export const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "경제":    "bg-[#ECFDF5] text-emerald-700",
  "정치":    "bg-blue-50 text-blue-600",
  "IT/기술": "bg-violet-50 text-violet-600",
  "IT":      "bg-violet-50 text-violet-600",
  "기술":    "bg-violet-50 text-violet-600",
  "사회":    "bg-orange-50 text-orange-600",
  "금융":    "bg-amber-50 text-amber-700",
  "국제":    "bg-sky-50 text-sky-600",
  "부동산":  "bg-rose-50 text-rose-600",
  "증시":    "bg-[#ECFDF5] text-emerald-700",
  "코인":    "bg-indigo-50 text-indigo-600",
}

export function getCategoryBadgeStyle(category: string): string {
  return CATEGORY_BADGE_STYLES[category] ?? "bg-slate-100 text-slate-500"
}
