"use client"

import { X } from "lucide-react"

// =============================================================================
// 📄 PolicyModal — 이용약관 / 개인정보처리방침 팝업
// =============================================================================

export type PolicyType = "terms" | "privacy"

const POLICY_CONTENT: Record<PolicyType, { title: string; content: string }> = {
  terms: {
    title: "이용약관",
    content: `제1조 (목적)
이 약관은 덕구(이하 "서비스")를 이용함에 있어 서비스와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 덕구가 제공하는 금융 뉴스 브리핑, 커뮤니티, 자산 관리 등의 기능을 말합니다.
② "이용자"란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
② 서비스는 합리적인 사유가 있을 경우 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 안내합니다.

제4조 (서비스 이용)
① 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.
② 서비스는 시스템 점검, 유지 보수 등의 사유로 일시적으로 서비스를 중단할 수 있습니다.
③ 서비스에서 제공하는 금융 정보는 투자 권유가 아니며, 투자 결정은 이용자 본인의 판단과 책임 하에 이루어져야 합니다.

제5조 (이용자의 의무)
① 이용자는 관련 법령, 이 약관의 규정 및 서비스의 이용 안내를 준수하여야 합니다.
② 이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.
③ 이용자는 서비스의 운영을 고의 또는 과실로 방해해서는 안 됩니다.

제6조 (면책 조항)
① 서비스는 천재지변, 불가항력적인 사유로 인해 서비스를 제공하지 못할 경우 책임이 면제됩니다.
② 서비스에서 제공하는 금융 정보의 정확성에 대해 보증하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.

제7조 (준거법 및 관할)
이 약관은 대한민국 법률에 따라 규율되며, 분쟁이 발생할 경우 관할 법원에서 해결합니다.

시행일: 2026년 1월 1일`,
  },
  privacy: {
    title: "개인정보처리방침",
    content: `덕구(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 개인정보보호법 등 관련 법령을 준수합니다.

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

시행일: 2026년 1월 1일`,
  },
}

interface PolicyModalProps {
  type: PolicyType
  onClose: () => void
}

export function PolicyModal({ type, onClose }: PolicyModalProps) {
  const { title, content } = POLICY_CONTENT[type]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 모달 본문 */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h2 className="text-[16px] font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 (스크롤 가능) */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <pre className="text-[12px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
            {content}
          </pre>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[13px] font-black transition-all active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
