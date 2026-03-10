import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "개인정보처리방침 | 덕구의 뉴스곳간",
  description: "덕구의 뉴스곳간 개인정보처리방침",
}

const content = `덕구(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 개인정보보호법 등 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
  - 소셜 로그인(구글, 카카오)을 통해 수집: 이름, 이메일 주소, 프로필 사진
  - 서비스 이용 과정에서 자동 수집: 서비스 이용 기록, IP 주소, 접속 일시

2. 개인정보 수집 및 이용 목적
  - 회원 식별 및 서비스 제공
  - 커뮤니티, 자산 관리 등 서비스 기능 제공
  - 서비스 개선 및 통계 분석

3. 개인정보 보유 및 이용 기간
  - 회원 탈퇴 시 즉시 삭제합니다.
  - 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관됩니다.

4. 개인정보의 제3자 제공
  - 서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
  - 다만, 법령에 의거하거나 수사 목적으로 법령에 정해진 절차에 따른 경우는 예외입니다.

5. 개인정보 처리 위탁
  - Supabase (인증 및 데이터베이스 서비스)
  - Vercel (서비스 호스팅)

6. 이용자의 권리
  - 이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다.
  - 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.

7. 쿠키 사용
  - 서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다.
  - 브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.

8. 개인정보 보호 책임자
  - 이메일: privacy@dukgu.kr

9. 변경 고지
  - 개인정보처리방침 변경 시 서비스 내 공지사항을 통해 안내합니다.

시행일: 2026년 1월 1일`

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[#F2F4F6]">
      <div className="w-full max-w-md mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/login"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-[17px] font-black text-slate-900">개인정보처리방침</h1>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <pre className="text-[12px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}
