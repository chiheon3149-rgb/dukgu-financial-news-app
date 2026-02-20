"use client"

import { useState } from "react"
import { Home, FileText, Archive, User } from "lucide-react"

const navItems = [
  { icon: Home, label: "\uD648", id: "home" },
  { icon: FileText, label: "\uBE0C\uB9AC\uD551", id: "briefing" },
  { icon: Archive, label: "\uC544\uCE74\uC774\uBE0C", id: "archive" },
  { icon: User, label: "\uB9C8\uC774\uD398\uC774\uC9C0", id: "mypage" },
]

export function BottomNav() {
  const [active, setActive] = useState("home")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border" aria-label={"\uBA54\uC778 \uB0B4\uBE44\uAC8C\uC774\uC158"}>
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 min-w-[56px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                  }`}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[10px] transition-all ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
