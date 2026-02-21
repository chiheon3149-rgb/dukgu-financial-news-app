"use client"

import Link from "next/link"
import { Home } from "lucide-react"
// 💡 여기서도 동일하게 수입!
import { DetailHeader } from "@/components/dukgu/detail-header"

export default function NoticeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-dvh bg-white pb-20">
      
      {/* 💡 상세 페이지에도 적용! */}
      <DetailHeader 
        title="공지사항 상세" 
        rightElement={
          <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <Home className="w-5 h-5 text-slate-800" />
          </Link>
        }
      />

      {/* 본문 영역 */}
      <main className="p-5">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">안내</span>
            <p className="text-xs text-slate-400 font-medium">2026.02.21</p>
          </div>
          <h2 className="text-lg font-bold text-slate-800 leading-snug">
            [공지] 시스템 업데이트 작업 중입니다.
          </h2>
        </div>

        {/* 텍스트 내용 */}
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>안녕하세요. 서비스 운영팀입니다.</p>
          <p>더 나은 서비스 제공을 위해 아래와 같이 시스템 업데이트가 진행될 예정입니다. 작업 시간 동안에는 서비스 이용이 일시적으로 제한될 수 있으니 양해 부탁드립니다.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg text-xs border border-slate-100">
            <ul className="space-y-2 font-medium">
              <li><span className="text-slate-500 w-12 inline-block">작업 일시</span>: 2026년 2월 21일(토) 24:00 ~ 02:00</li>
              <li><span className="text-slate-500 w-12 inline-block">작업 내용</span>: 글로벌 무역망 데이터 패치 및 시스템 안정화</li>
              <li><span className="text-slate-500 w-12 inline-block">영향 범위</span>: 미국/한국 브리핑 데이터 업데이트 지연 가능성</li>
            </ul>
          </div>
          
          <p>앞으로도 더 빠르고 안정적인 서비스를 제공하기 위해 노력하겠습니다. 감사합니다.</p>
        </div>
      </main>

    </div>
  )
}