import type { UserProfile, LevelMeta, SavedArticle, ArticleReaction, InquiryMessage } from "@/types"

// =============================================================================
// 👤 유저 목(Mock) 데이터
// 실제 서비스에서는 Supabase auth + profiles 테이블에서 불러옵니다.
// =============================================================================

export const MOCK_USER: UserProfile = {
  id: "user-001",
  nickname: "덕구팬",
  email: "user@dukgu.app",
  joinedAt: "2025-11-01T00:00:00+09:00",
  avatarEmoji: "🐱",
  totalXp: 185,
  xpHistory: [
    { id: "xp-001", source: "quiz_correct", amount: 50, label: "경제 퀴즈 정답", earnedAt: "2026-02-22T10:00:00+09:00" },
    { id: "xp-002", source: "quiz_correct", amount: 50, label: "정치 퀴즈 정답", earnedAt: "2026-02-15T10:00:00+09:00" },
    { id: "xp-003", source: "quiz_correct", amount: 50, label: "사회 퀴즈 정답", earnedAt: "2026-02-08T10:00:00+09:00" },
    { id: "xp-004", source: "daily_login",  amount: 10, label: "출석 체크",        earnedAt: "2026-02-22T09:00:00+09:00" },
    { id: "xp-005", source: "daily_login",  amount: 10, label: "출석 체크",        earnedAt: "2026-02-21T09:00:00+09:00" },
    { id: "xp-006", source: "daily_login",  amount: 15, label: "3일 연속 출석 보너스", earnedAt: "2026-02-20T09:00:00+09:00" },
  ],
}

// =============================================================================
// 🏆 레벨 정의 테이블
//
// 레벨 설계 철학:
// 초반(1~3레벨)은 빠르게 올라가서 성취감을 주고,
// 중반부터는 점점 더 많은 노력이 필요하도록 설계합니다.
// 퀴즈 정답 1회당 50XP 기준으로, 레벨 5까지 도달에 약 20회 정답이 필요합니다.
// =============================================================================

export const LEVEL_TABLE: LevelMeta[] = [
  { level: 1, title: "새싹 투자자",    minXp: 0,    maxXp: 100,  icon: "🌱" },
  { level: 2, title: "견습 분석가",    minXp: 100,  maxXp: 250,  icon: "📊" },
  { level: 3, title: "주니어 트레이더", minXp: 250,  maxXp: 500,  icon: "📈" },
  { level: 4, title: "시니어 투자자",  minXp: 500,  maxXp: 900,  icon: "💼" },
  { level: 5, title: "포트폴리오 마스터", minXp: 900, maxXp: 1500, icon: "🏆" },
  { level: 6, title: "월스트리트 레전드", minXp: 1500, maxXp: 9999, icon: "👑" },
]

/** 누적 XP로 현재 레벨 메타를 계산합니다 */
export function getLevelMeta(totalXp: number): LevelMeta {
  return (
    [...LEVEL_TABLE].reverse().find((l) => totalXp >= l.minXp) ?? LEVEL_TABLE[0]
  )
}

// =============================================================================
// 🔖 북마크 / 반응 Mock 데이터
// =============================================================================

export const MOCK_SAVED_ARTICLES: SavedArticle[] = [
  {
    newsId: "news-003",
    savedAt: "2026-02-22T10:30:00+09:00",
    snapshot: { headline: "삼성전자, HBM AI 반도체 수주 2조원 돌파", category: "경제", timeAgo: "1시간 전", tags: ["#삼성전자", "#HBM"] },
  },
  {
    newsId: "news-007",
    savedAt: "2026-02-21T18:00:00+09:00",
    snapshot: { headline: "오픈AI, 새로운 추론 모델 '오리온' 다음 달 깜짝 공개", category: "경제", timeAgo: "3시간 전", tags: ["#오픈AI", "#인공지능"] },
  },
  {
    newsId: "news-005",
    savedAt: "2026-02-20T09:00:00+09:00",
    snapshot: { headline: "서울 아파트 매매가, 강남 3구 중심으로 3주 연속 상승", category: "사회", timeAgo: "어제", tags: ["#부동산", "#강남3구"] },
  },
]

export const MOCK_ARTICLE_REACTIONS: ArticleReaction[] = [
  { newsId: "news-002", type: "like",    reactedAt: "2026-02-22T09:10:00+09:00", snapshot: { headline: "미 연준 의사록 공개… 올해 하반기 금리 인하 시그널", category: "경제", timeAgo: "25분 전" } },
  { newsId: "news-006", type: "like",    reactedAt: "2026-02-21T20:00:00+09:00", snapshot: { headline: "MZ세대 '커피값으로 주식 산다'… 소액 투자 열풍", category: "문화", timeAgo: "2시간 전" } },
  { newsId: "news-004", type: "dislike", reactedAt: "2026-02-21T14:00:00+09:00", snapshot: { headline: "정부, 민생 안정 위한 하반기 추경 편성 공식 검토", category: "정치", timeAgo: "어제" } },
]

export const MOCK_INQUIRIES: InquiryMessage[] = [
  {
    id: "inq-001",
    category: "feature",
    title: "ETF 섹터 분류 기능 요청",
    body: "VOO, QQQ 같은 ETF의 섹터 비중을 보여주는 기능이 있으면 좋겠습니다.",
    submittedAt: "2026-02-18T15:30:00+09:00",
    status: "in_review",
    reply: "좋은 제안 감사합니다! 다음 업데이트에 반영 예정입니다. 🙏",
  },
]
