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
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-[#EEEEEE] z-50 pb-safe">
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
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-95 ${
                isActive ? "text-[#00B887]" : "text-[#BBBBBB]"
              }`}
            >
              <Icon className={`w-[22px] h-[22px] ${isActive ? "fill-[#E8F7F2]" : ""}`} />
              <span className="text-[11px] font-bold">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
