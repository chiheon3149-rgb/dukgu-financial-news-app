import type { DailyBriefingLog } from "@/types"

// =============================================================================
// ⚡ 브리핑 목(Mock) 데이터
// 나중에 Supabase API 호출로 교체될 자리입니다.
// useBriefingLogs 훅 외에는 이 파일을 직접 import하지 않습니다.
// =============================================================================

export const MOCK_BRIEFING_LOGS: DailyBriefingLog[] = [
  {
    id: "2026-02-21",
    date: "2026년 2월 21일(토요일)",
    morning: {
      type: "morning",
      time: "08:30",
      headline: "엔비디아發 훈풍, 나스닥 신고가 경신",
      indices: [
        { name: "다우", change: "+0.12%" },
        { name: "나스닥", change: "+1.24%" },
        { name: "S&P500", change: "+0.85%" },
        { name: "러셀", change: "+1.50%" },
      ],
      isReady: true,
    },
    afternoon: {
      type: "afternoon",
      time: "16:30",
      headline: "코스피 상승 출발, 밸류업 정책 기대감",
      indices: [
        { name: "코스피", change: "+0.45%" },
        { name: "코스닥", change: "-0.12%" },
        { name: "코스피200", change: "+0.32%" },
      ],
      isReady: true,
    },
  },
  {
    id: "2026-02-20",
    date: "2026년 2월 20일(금요일)",
    morning: {
      type: "morning",
      time: "08:25",
      headline: "금리 인하 신중론에 국채 금리 반등",
      indices: [
        { name: "다우", change: "-0.22%" },
        { name: "나스닥", change: "-0.55%" },
        { name: "S&P500", change: "-0.40%" },
        { name: "러셀", change: "-1.10%" },
      ],
      isReady: true,
    },
    afternoon: {
      type: "afternoon",
      time: "16:40",
      headline: "외인 매도세에 코스닥 800선 하회",
      indices: [
        { name: "코스피", change: "-0.32%" },
        { name: "코스닥", change: "-1.02%" },
        { name: "코스피200", change: "-0.28%" },
      ],
      isReady: true,
    },
  },
  {
    id: "2026-02-19",
    date: "2026년 2월 19일(목요일)",
    morning: {
      type: "morning",
      time: "08:35",
      headline: "빅테크 실적 시즌 기대감에 S&P500 반등",
      indices: [
        { name: "다우", change: "+0.55%" },
        { name: "나스닥", change: "+0.98%" },
        { name: "S&P500", change: "+0.72%" },
        { name: "러셀", change: "+0.30%" },
      ],
      isReady: true,
    },
    afternoon: {
      type: "afternoon",
      time: "16:25",
      headline: "코스피 2,680선 회복, 반도체 주도 강세",
      indices: [
        { name: "코스피", change: "+0.88%" },
        { name: "코스닥", change: "+0.54%" },
        { name: "코스피200", change: "+0.91%" },
      ],
      isReady: true,
    },
  },
]
