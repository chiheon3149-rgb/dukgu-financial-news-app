"use client"

import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Home, Zap, TrendingUp, Users, User, ChevronLeft } from "lucide-react"
import { Suspense } from "react"

const HIDDEN_PATHS = ["/login", "/auth"]

type SijangTab = "holdings" | "watchlist" | "discover"

const SIJANG_TABS: { id: SijangTab; label: string }[] = [
  { id: "holdings",  label: "보유" },
  { id: "watchlist", label: "관심" },
  { id: "discover",  label: "발견" },
]

const NAV_ITEMS = [
  { name: "홈",       path: "/",          icon: Home       },
  { name: "브리핑",   path: "/briefing",  icon: Zap        },
  { name: "증시",     path: "/assets",    icon: TrendingUp },
  { name: "커뮤니티", path: "/community", icon: Users      },
  { name: "마이",     path: "/mypage",    icon: User       },
]

// ── 증시 서브 네비 ──────────────────────────────────────────────────────────
function SijangSubNavBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get("tab") as SijangTab) ?? "discover"

  return (
    <div className="flex items-center h-[60px] px-2">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.push("/")}
        className="flex flex-col items-center justify-center w-14 h-full gap-0.5 text-[#6B7280] hover:text-slate-900 active:scale-95 transition-all duration-200"
      >
        <div className="p-1.5 rounded-xl">
          <ChevronLeft className="w-[20px] h-[20px]" />
        </div>
        <span className="text-[10px] font-semibold">뒤로</span>
      </button>

      {/* 탭들 */}
      <div className="flex flex-1 justify-around items-center h-full">
        {SIJANG_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => router.replace(`/assets?tab=${tab.id}`)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 ${
                isActive ? "text-emerald-600" : "text-[#6B7280]"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-emerald-500" />
              )}
              <div className={`px-4 py-1 rounded-xl transition-colors ${isActive ? "bg-emerald-50" : ""}`}>
                <span className={`text-[13px] font-black ${isActive ? "text-emerald-600" : "text-[#6B7280]"}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 메인 네비 ──────────────────────────────────────────────────────────────
function MainNavBar({ pathname }: { pathname: string }) {
  return (
    <div className="flex justify-around items-center h-[60px] px-1">
      {NAV_ITEMS.map((item) => {
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
  )
}

// ── 바텀 네비 본체 ──────────────────────────────────────────────────────────
function BottomNavContent() {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  // 증시 메인 페이지일 때 서브탭으로 교체 (상세/검색 페이지는 메인 네비 유지)
  const isSijangMain = pathname === "/assets"

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 pb-safe overflow-hidden">

      {/*
        두 개의 네비바를 겹쳐 놓고 translateY로 슬라이드:
          - 메인: isSijangMain → 아래로 숨김 (translateY +100%)
          - 서브: isSijangMain → 위로 등장 (translateY 0)
      */}

      {/* 메인 네비 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSijangMain ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <MainNavBar pathname={pathname} />
      </div>

      {/* 증시 서브 네비 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSijangMain ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Suspense fallback={null}>
          <SijangSubNavBar />
        </Suspense>
      </div>

      {/* 높이 유지용 더미 */}
      <div className="h-[60px] invisible" />
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
