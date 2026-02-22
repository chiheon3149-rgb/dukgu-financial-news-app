// "use client" 제거 → 이 파일은 이제 서버 컴포넌트입니다.
//
// Next.js App Router에서 서버 컴포넌트는 기본값입니다.
// 이 페이지가 하는 일은 컴포넌트들을 조립하는 것뿐이고,
// 실제 상태 관리와 훅 사용은 각 자식 컴포넌트(AssetTotalCard, AssetCategoryList) 안에
// 캡슐화되어 있습니다.
//
// 덕분에 이 페이지의 마크업은 서버에서 미리 렌더링되어 HTML로 내려오고,
// 클라이언트 JS 번들 크기도 줄어들어 초기 로딩이 빨라집니다.

import { Wallet } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AssetTotalCard } from "@/components/dukgu/asset-total-card"
import { AssetAllocationChart } from "@/components/dukgu/asset-allocation-chart"
import { AssetCategoryList } from "@/components/dukgu/asset-category-list"

// 섹션 헤더 반복 패턴을 인라인 컴포넌트로 추출 — page 내부에서만 쓰이므로 별도 파일 불필요
function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
        {title}
      </h2>
      {action}
    </div>
  )
}

export default function AssetsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            <span className="text-lg font-black text-slate-900 tracking-tight">내 자산</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6 space-y-8">

        {/* 총 자산 요약 */}
        <section className="space-y-4">
          <SectionHeader title="자산 요약" />
          <AssetTotalCard />
        </section>

        {/* 포트폴리오 비중 차트 */}
        <section className="space-y-4">
          <SectionHeader title="포트폴리오 비중" />
          <AssetAllocationChart />
        </section>

        {/* 개별 자산 카테고리 리스트 */}
        <section className="space-y-4">
          <SectionHeader
            title="개별 자산 현황"
            action={
              // 자산 추가 버튼: 향후 /assets/new 라우트 연결 예정
              <button className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full transition-all active:scale-95">
                + 자산 추가
              </button>
            }
          />
          {/* 이전에 3번 복사하던 카드 JSX가 이 한 줄로 대체됩니다 */}
          <AssetCategoryList />
        </section>

      </main>
    </div>
  )
}
