"use client"

import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Home, Zap, TrendingUp, Users, User, ChevronLeft, Wallet, Star, Compass } from "lucide-react"
import { Suspense } from "react"

const HIDDEN_PATHS = ["/login", "/auth"]

type SijangTab = "holdings" | "watchlist" | "discover"

const SIJANG_TABS: {
  id: SijangTab
  label: string
  Icon: React.ElementType
  ActiveIcon: React.ElementType
}[] = [
  { id: "holdings",  label: "보유", Icon: Wallet,  ActiveIcon: Wallet  },
  { id: "watchlist", label: "관심", Icon: Star,    ActiveIcon: Star    },
  { id: "discover",  label: "발견", Icon: Compass, ActiveIcon: Compass },
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
    <div className="flex items-center h-[60px]">
      {/* 뒤로가기 */}
      <button
        onClick={() => router.push("/")}
        className="flex flex-col items-center justify-center w-[52px] h-full gap-0.5 shrink-0 text-[#6B7280] hover:text-slate-800 active:scale-90 transition-all duration-150"
      >
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-[9px] font-bold text-slate-400">뒤로</span>
      </button>

      {/* 탭들 */}
      {SIJANG_TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.Icon
        return (
          <button
            key={tab.id}
            onClick={() => router.replace(`/assets?tab=${tab.id}`)}
            className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-90"
          >
            {/* 활성 인디케이터 */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] rounded-full bg-emerald-500" />
            )}

            {/* 아이콘 */}
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              isActive ? "bg-emerald-50 scale-110" : ""
            }`}>
              <Icon
                className={`w-[22px] h-[22px] transition-all duration-200 ${
                  isActive
                    ? "stroke-emerald-600 stroke-[2.5px]"
                    : "stroke-[#9CA3AF] stroke-2"
                }`}
                fill={isActive ? "rgba(16,185,129,0.12)" : "none"}
              />
            </div>

            {/* 라벨 */}
            <span className={`text-[10px] font-bold transition-colors duration-200 ${
              isActive ? "text-emerald-600" : "text-[#9CA3AF]"
            }`}>
              {tab.label}
            </span>
          </button>
        )
      })}
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
            className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 active:scale-90 ${
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

  const isSijangMain = pathname === "/assets"

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 pb-safe overflow-hidden">

      {/*
        오른쪽에서 왼쪽으로 슬라이드:
          - 메인: isSijangMain → 왼쪽으로 퇴장 (-translateX 100%)
          - 서브: isSijangMain → 오른쪽에서 등장 (translateX 0)
      */}

      {/* 메인 네비 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSijangMain ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <MainNavBar pathname={pathname} />
      </div>

      {/* 증시 서브 네비 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSijangMain ? "translate-x-0" : "translate-x-full"
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
