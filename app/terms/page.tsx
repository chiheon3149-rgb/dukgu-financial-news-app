import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "이용약관 | 덕구의 뉴스곳간",
  description: "덕구의 뉴스곳간 서비스 이용약관",
}

const content = `제1조 (목적)
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

시행일: 2026년 1월 1일`

export default function TermsPage() {
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
          <h1 className="text-[17px] font-black text-slate-900">이용약관</h1>
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
