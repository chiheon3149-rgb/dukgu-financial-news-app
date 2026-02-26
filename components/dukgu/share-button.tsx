"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string // 🎨 디자인을 외부에서 주입받을 수 있게 추가
  children?: React.ReactNode // 📝 버튼 내부의 글자나 아이콘을 자유롭게 바꾸기 위해 추가
}

export function ShareButton({ title, text, url, className, children }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url || window.location.href
    const shareData = { title, text, url: shareUrl }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("공유 취소")
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setIsCopied(true)
        toast.success("링크가 복사되었습니다! 친구에게 전달해 보세요 🐾")
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        toast.error("링크 복사에 실패했습니다.")
      }
    }
  }

  return (
    <button onClick={handleShare} className={className}>
      {/* 💡 children이 있으면 그걸 보여주고, 없으면 기본 아이콘을 보여줍니다. */}
      {children || <Share2 className="w-5 h-5 text-slate-600" />}
      {isCopied && !children && <span className="sr-only">복사됨</span>}
    </button>
  )
}