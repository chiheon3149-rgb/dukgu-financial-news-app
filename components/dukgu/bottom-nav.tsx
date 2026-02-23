"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, Wallet, Users, User } from "lucide-react"

const HIDDEN_PATHS = ["/login", "/auth"]

export function BottomNav() {
  const pathname = usePathname()

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const navItems = [
    { name: "홈",      path: "/",          icon: Home   },
    { name: "브리핑",  path: "/briefing",  icon: Zap    },
    { name: "자산",    path: "/assets",    icon: Wallet },
    { name: "커뮤니티", path: "/community", icon: Users  },
    { name: "마이",    path: "/mypage",    icon: User   },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (pathname.startsWith(`${item.path}/`) && item.path !== "/")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
                isActive
                  ? "text-emerald-500 scale-105"
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "fill-emerald-100" : ""}`} />
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
              </div>
              <span className="text-[9px] font-black">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
