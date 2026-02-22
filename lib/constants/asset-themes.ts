// =============================================================================
// 🎨 자산 카테고리 색상 테마 매핑
//
// 왜 이 파일이 필요한가?
// Tailwind CSS는 빌드 시 소스 코드를 정적으로 스캔해서 사용된 클래스만 최종
// CSS 파일에 포함합니다. 만약 `bg-${theme}-50`처럼 동적으로 문자열을 조합하면
// Tailwind가 어떤 클래스가 실제로 사용되는지 알 수 없어서 스타일이 적용되지
// 않는 버그가 발생합니다.
// 완전한 클래스 문자열을 미리 객체에 적어두면 이 문제를 안전하게 해결합니다.
// =============================================================================

export interface AssetTheme {
  /** 카드 배경 hover 색상 */
  hoverBorder: string
  /** 아이콘 배경 색상 */
  iconBg: string
  /** 아이콘 텍스트 색상 */
  iconColor: string
  /** 상승률 텍스트 색상 */
  rateUp: string
  /** 하락률 텍스트 색상 */
  rateDown: string
}

export const ASSET_THEMES: Record<string, AssetTheme> = {
  emerald: {
    hoverBorder: "hover:border-emerald-200",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    rateUp: "text-rose-500",
    rateDown: "text-blue-500",
  },
  indigo: {
    hoverBorder: "hover:border-indigo-200",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    rateUp: "text-rose-500",
    rateDown: "text-blue-500",
  },
  amber: {
    hoverBorder: "hover:border-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    rateUp: "text-rose-500",
    rateDown: "text-blue-500",
  },
  rose: {
    hoverBorder: "hover:border-rose-200",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    rateUp: "text-rose-500",
    rateDown: "text-blue-500",
  },
  blue: {
    hoverBorder: "hover:border-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    rateUp: "text-rose-500",
    rateDown: "text-blue-500",
  },
}
