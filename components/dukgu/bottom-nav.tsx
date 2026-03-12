"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, TrendingUp, Users, User } from "lucide-react"

const HIDDEN_PATHS = ["/login", "/auth"]

export function BottomNav() {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const navItems = [
    { name: "홈",      path: "/",          icon: Home   },
    { name: "브리핑",  path: "/briefing",  icon: Zap    },
    { name: "증시",    path: "/assets",    icon: TrendingUp },
    { name: "커뮤니티", path: "/community", icon: Users  },
    { name: "마이",    path: "/mypage",    icon: User   },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 pb-safe">
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
