"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, Wallet, User } from "lucide-react" // 💡 자산 탭을 위한 Wallet 아이콘 추가

export function BottomNav() {
  const pathname = usePathname()

  // 💡 하단바 메뉴 구성 트리 (기획서 역할)
  const navItems = [
    { name: "홈", path: "/", icon: Home },
    { name: "브리핑", path: "/briefing", icon: Zap },
    { name: "자산", path: "/assets", icon: Wallet }, // 🚀 드디어 연결된 우리의 본진!
    { name: "마이", path: "/mypage", icon: User },
  ]

  return (
    // 모바일 환경을 고려한 하단 고정(fixed) 및 안전 영역(pb-safe) 처리
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          // 현재 주소와 메뉴의 주소가 일치하는지 확인 (Active 상태)
          const isActive = pathname === item.path || (pathname.startsWith(`${item.path}/`) && item.path !== "/");
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200 ${
                isActive 
                  ? "text-emerald-500 scale-105" // 💡 선택되었을 때 민트색 & 살짝 커짐
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "fill-emerald-100" : ""}`} />
                {/* 💡 기획 디테일: 선택된 탭 위에 작은 점(Indicator)을 띄워 강조 */}
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-black">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}