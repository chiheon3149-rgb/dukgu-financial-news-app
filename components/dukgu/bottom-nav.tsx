"use client"

import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Home, Zap, TrendingUp, Users, User } from "lucide-react"
import { Suspense } from "react"

const HIDDEN_PATHS = ["/login", "/auth"]

type SijangTab = "holdings" | "watchlist" | "discover"

const SIJANG_TABS: { id: SijangTab; label: string }[] = [
  { id: "holdings",  label: "보유" },
  { id: "watchlist", label: "관심" },
  { id: "discover",  label: "발견" },
]

function SijangSubNav() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get("tab") as SijangTab) ?? "discover"

  return (
    <div className="flex justify-around items-center h-[44px] px-6 border-b border-slate-100">
      {SIJANG_TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => router.replace(`/assets?tab=${tab.id}`)}
            className={`relative flex items-center justify-center px-5 h-full text-[13px] font-black transition-colors duration-200 ${
              isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-emerald-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function BottomNavContent() {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  // 증시 메인 페이지에서만 서브탭 노출 (상세/검색 페이지 제외)
  const isSijangMain = pathname === "/assets"

  const navItems = [
    { name: "홈",      path: "/",          icon: Home       },
    { name: "브리핑",  path: "/briefing",  icon: Zap        },
    { name: "증시",    path: "/assets",    icon: TrendingUp },
    { name: "커뮤니티", path: "/community", icon: Users      },
    { name: "마이",    path: "/mypage",    icon: User       },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 pb-safe">
      {/* 증시 서브탭 — 슬라이드 업 애니메이션 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isSijangMain ? "max-h-[44px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <Suspense fallback={null}>
          <SijangSubNav />
        </Suspense>
      </div>

      {/* 메인 바텀 네비 */}
      <div className="flex justify-around items-center h-[60px] px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (pathname.startsWith(`${item.path}/`) && item.path !== "/")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 active:scale-95 ${
                isActive ? "text-emerald-600" : "text-[#6B7280]"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-emerald-500" />
              )}
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-emerald-50" : ""}`}>
                <Icon className={`w-[20px] h-[20px] ${isActive ? "stroke-emerald-600" : ""}`} />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-emerald-600" : "text-[#6B7280]"}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  )
}
