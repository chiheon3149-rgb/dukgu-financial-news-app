"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// 💡 방금 만든 알림 팝업 부품을 수입합니다!
import { NoticeDropdown } from "@/components/dukgu/notice-dropdown"

export function StickyHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        
        <Link href="/">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground cursor-pointer">
            DUKGU
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          
          {/* 💡 기존의 길었던 버튼 코드를 지우고, 이 부품 하나로 깔끔하게 교체! */}
          <NoticeDropdown />

          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src="https://api.dicebear.com/9.x/thumbs/svg?seed=dukgu&backgroundColor=c0aede" alt={"프로필"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">DK</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded-full border border-accent/30">
              Lv.2
            </span>
          </div>
        </div>
        
      </div>
    </header>
  )
}