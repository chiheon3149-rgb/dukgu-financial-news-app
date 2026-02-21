import { AlertCircle } from "lucide-react"

export function AiDisclaimer() {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-8 flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="text-[11px] text-slate-500 font-medium leading-relaxed tracking-tight">
        <p className="mb-1 font-bold text-slate-600">※ 덕구 AI 요약 알림사항</p>
        <p>본 기사는 AI가 요약 및 정리한 내용으로, 정치적인 목적이나 특정 의도와는 무관합니다. 또한 본 정보는 투자 권유를 목적으로 하지 않으며, 이를 활용한 투자 판단의 최종 책임은 유저 본인에게 있습니다.</p>
      </div>
    </div>
  )
}