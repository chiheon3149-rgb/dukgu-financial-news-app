"use client"

import { useState } from "react"
import {
  Wallet, TrendingUp, Landmark, Bitcoin, Banknote,
  Building2, ScrollText, Package, Plus, X, ChevronRight,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { DetailHeader } from "@/components/dukgu/detail-header"

// =============================================================================
// 💰 /assets — 내 자산 메인 페이지
// =============================================================================

interface AssetTypeConfig {
  id: string
  name: string
  description: string
  icon?: LucideIcon
  emoji?: string
  color: "emerald" | "indigo" | "amber" | "yellow" | "blue" | "rose"
  href: string
}

const ASSET_TYPES: AssetTypeConfig[] = [
  { id: "stocks",    name: "주식",    description: "국내 / 해외",    icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { id: "realestate",name: "부동산",  description: "아파트, 토지 등", icon: Landmark,   color: "indigo",  href: "/assets/realestate" },
  { id: "crypto",    name: "코인",    description: "BTC, ETH 등",    icon: Bitcoin,    color: "amber",   href: "/assets/crypto"     },
  { id: "gold",      name: "금",      description: "금 현물",         emoji: "🥇",       color: "yellow",  href: "/assets/gold"       },
  { id: "cash",      name: "현금",    description: "원화, 외화",      icon: Banknote,   color: "emerald", href: "/assets/cash"       },
  { id: "savings",   name: "예·적금", description: "예금, 적금",      icon: Building2,  color: "blue",    href: "/assets/savings"    },
  { id: "bonds",     name: "채권",    description: "국채, 회사채",    icon: ScrollText, color: "indigo",  href: "/assets/bonds"      },
  { id: "etc",       name: "기타",    description: "미술품, 자동차 등", icon: Package,  color: "rose",    href: "/assets/etc"        },
]

// 타입 피커에는 국내주식/해외주식 분리 표시 (같은 페이지로 이동)
const TYPE_PICKER = [
  { label: "국내주식", icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { label: "해외주식", icon: TrendingUp, color: "emerald", href: "/assets/stocks"     },
  { label: "부동산",   icon: Landmark,   color: "indigo",  href: "/assets/realestate" },
  { label: "코인",     icon: Bitcoin,    color: "amber",   href: "/assets/crypto"     },
  { label: "금",       emoji: "🥇",       color: "yellow",  href: "/assets/gold"       },
  { label: "현금",     icon: Banknote,   color: "emerald", href: "/assets/cash"       },
  { label: "예·적금", icon: Building2,  color: "blue",    href: "/assets/savings"    },
  { label: "채권",     icon: ScrollText, color: "indigo",  href: "/assets/bonds"      },
  { label: "기타",     icon: Package,    color: "rose",    href: "/assets/etc"        },
] as const

const COLOR_MAP = {
  emerald: { hover: "hover:border-emerald-200", iconBg: "bg-emerald-50", iconText: "text-emerald-500", chevron: "group-hover:text-emerald-500" },
  indigo:  { hover: "hover:border-indigo-200",  iconBg: "bg-indigo-50",  iconText: "text-indigo-500",  chevron: "group-hover:text-indigo-500"  },
  amber:   { hover: "hover:border-amber-200",   iconBg: "bg-amber-50",   iconText: "text-amber-500",   chevron: "group-hover:text-amber-500"   },
  yellow:  { hover: "hover:border-yellow-200",  iconBg: "bg-yellow-50",  iconText: "text-yellow-500",  chevron: "group-hover:text-yellow-500"  },
  blue:    { hover: "hover:border-blue-200",    iconBg: "bg-blue-50",    iconText: "text-blue-500",    chevron: "group-hover:text-blue-500"    },
  rose:    { hover: "hover:border-rose-200",    iconBg: "bg-rose-50",    iconText: "text-rose-500",    chevron: "group-hover:text-rose-500"    },
}

export default function AssetsPage() {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">내 자산</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">

        {/* 자산 현황 헤더 */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            자산 현황
          </h2>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95"
          >
            <Plus className="w-3 h-3" /> 자산 추가
          </button>
        </div>

        {/* 자산 카테고리 네비게이션 카드 */}
        <div className="grid gap-3">
          {ASSET_TYPES.map((type) => {
            const theme = COLOR_MAP[type.color]
            const Icon = type.icon
            return (
              <Link
                key={type.id}
                href={type.href}
                className={`flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm ${theme.hover} transition-all group active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${theme.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {Icon
                      ? <Icon className={`w-6 h-6 ${theme.iconText}`} />
                      : <span className="text-2xl">{type.emoji}</span>
                    }
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-800">{type.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400">{type.description}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-300 ${theme.chevron} transition-colors`} />
              </Link>
            )
          })}
        </div>

      </main>

      {/* 자산 추가 타입 피커 바텀 시트 */}
      {isPickerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsPickerOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] px-5 pt-5 pb-10 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-black text-slate-800">어떤 자산을 추가할까요?</h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {TYPE_PICKER.map((t) => {
                const theme = COLOR_MAP[t.color]
                const Icon = "icon" in t ? t.icon : undefined
                return (
                  <Link
                    key={t.label}
                    href={t.href}
                    onClick={() => setIsPickerOpen(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-[20px] border border-slate-100 hover:border-slate-200 active:scale-95 transition-all"
                  >
                    <div className={`w-11 h-11 ${theme.iconBg} rounded-2xl flex items-center justify-center`}>
                      {Icon
                        ? <Icon className={`w-5 h-5 ${theme.iconText}`} />
                        : <span className="text-xl">{"emoji" in t ? t.emoji : ""}</span>
                      }
                    </div>
                    <span className="text-[11px] font-black text-slate-700">{t.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
