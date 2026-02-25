// =============================================================================
// 📐 DUKGU — 전체 도메인 타입 정의
// 이 파일이 프로젝트의 "설계 도면"입니다.
// 컴포넌트, 훅, API 라우트 모두 이곳의 타입을 참조합니다.
// =============================================================================

// -----------------------------------------------------------------------------
// 🌐 공통 (Shared)
// -----------------------------------------------------------------------------

/** 화폐 단위 설정값 */
export type Currency = "KRW" | "USD"

/** 자산 변동 방향 */
export type ChangeStatus = "up" | "down" | "same"

/** 뉴스 카테고리 */
export type NewsCategory = "정치" | "경제" | "사회" | "문화" | "IT"

/** 브리핑 종류 (조간 = 미국장 마감, 마감 = 한국장 마감) */
export type BriefingType = "morning" | "afternoon"

/** 지수 종류 */
export type MarketMode = "US" | "KR"


// -----------------------------------------------------------------------------
// 💰 자산 (Asset)
// -----------------------------------------------------------------------------

/** 총자산 요약 카드에서 사용하는 데이터 */
export interface AssetSummary {
  totalKrw: number
  totalUsd: number
  /** 전월 대비 변동률 (%) */
  monthlyChangeRate: number
  changeStatus: ChangeStatus
  /** 마지막 업데이트 시각 (ISO 8601) */
  updatedAt: string
}

/** 자산 카테고리 아이템 (주식, 부동산, 기타 등) */
export interface AssetCategory {
  id: string
  name: string
  description: string
  /** 아이콘 이름 (lucide-react key) */
  icon: string
  /** 색상 테마 키 (emerald, indigo, amber 등) */
  colorTheme: string
  valueKrw: number
  changeRate: number
  changeStatus: ChangeStatus
}

/** 일별 자산 기록 (히스토리 리스트에서 사용) */
export interface AssetHistoryItem {
  /** YYYY-MM-DD 형식 */
  date: string
  totalKrw: number
  changeKrw: number
  changeStatus: ChangeStatus
}


// -----------------------------------------------------------------------------
// 📰 뉴스 (News)
// -----------------------------------------------------------------------------

/** 뉴스 피드의 단일 아이템 */
export interface NewsItem {
  id: string
  category: NewsCategory
  tags: string[]
  headline: string
  summary: string
  /** "10분 전", "2시간 전" 등 상대적 시간 표시 */
  timeAgo: string
  publishedAt: string
  goodCount: number
  badCount: number
  commentCount: number
  viewCount: number // 👈 [핵심 추가] 500명 동시접속 대비 조회수 정렬을 위해 추가되었습니다.
  isSaved?: boolean
  source?: string | null
}


// -----------------------------------------------------------------------------
// ⚡ 브리핑 (Briefing)
// -----------------------------------------------------------------------------

/** 지수 한 줄 요약 (브리핑 카드 하단의 미니 지표) */
export interface IndexSummary {
  name: string
  /** "+1.24%" 또는 "-0.55%" 형식의 문자열 */
  change: string
}

/** 조간 또는 마감 브리핑 단위 */
export interface BriefingSession {
  type: BriefingType
  /** "08:30" 형식 */
  time: string
  headline: string
  indices: IndexSummary[]
  isReady: boolean
}

/** 하루치 브리핑 로그 (조간 + 마감) */
export interface DailyBriefingLog {
  /** YYYY-MM-DD — 정렬 및 필터링의 키값 */
  id: string
  /** "2026년 2월 21일(토요일)" 형식의 표시용 날짜 */
  date: string
  morning: BriefingSession
  afternoon: BriefingSession
}


// -----------------------------------------------------------------------------
// 📊 마켓 (Market)
// -----------------------------------------------------------------------------

/** 티커 바 및 지수 보드에서 사용하는 단일 지수 */
export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: ChangeStatus
}


// -----------------------------------------------------------------------------
// ⚙️ 사용자 설정 (User Preferences)
// 향후 LocalStorage 또는 DB와 연동될 설정값들을 미리 타입으로 정의해 둡니다.
// -----------------------------------------------------------------------------

export interface UserPreferences {
  currency: Currency
  isBlindMode: boolean
}


// -----------------------------------------------------------------------------
// 📈 주식 포트폴리오 (Stock Portfolio)
// -----------------------------------------------------------------------------

/** 매매 종류 */
export type TradeType = "buy" | "sell"

/** 단일 매매 기록 */
export interface TradeRecord {
  id: string
  /** YYYY-MM-DD */
  date: string
  type: TradeType
  /** 매매 당시 단가 (원 또는 달러) */
  price: number
  quantity: number
  /** 메모 (선택) */
  memo?: string
}

/** 배당 수령 기록 */
export interface DividendRecord {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** 주당 배당금 */
  amountPerShare: number
  /** 수령 당시 보유 수량 */
  sharesHeld: number
  currency: "KRW" | "USD"
}

/** 보유 주식 한 종목 전체 */
export interface StockHolding {
  /** Yahoo Finance 티커 (예: AAPL, 005930.KS) */
  ticker: string
  /** 표시 이름 */
  name: string
  /** 거래 통화 */
  currency: "KRW" | "USD"
  trades: TradeRecord[]
  dividends: DividendRecord[]
}

/** 평단가 및 보유 수량 계산 결과 */
export interface PortfolioStats {
  /** 현재 총 보유 수량 */
  totalShares: number
  /** 가중평균 매입단가 */
  avgCostPrice: number
  /** 총 투자 원금 */
  totalInvested: number
  /** 실현 손익 (매도분) */
  realizedPnl: number
}

/** API에서 가져온 실시간 시세 */
export interface MarketQuote {
  ticker: string
  currentPrice: number
  currency: "KRW" | "USD"
  /** 전일 대비 변동률 (%) */
  changeRate: number
  changeStatus: ChangeStatus
  /** 마지막 업데이트 시각 */
  fetchedAt: string
}

/** 차트에서 사용하는 평단가 추이 데이터 포인트 */
export interface AvgCostDataPoint {
  date: string
  avgCost: number
  tradePrice?: number
  tradeType?: TradeType
  shares?: number
}


// -----------------------------------------------------------------------------
// 🥇 금 (Gold)
// -----------------------------------------------------------------------------

export interface GoldHolding {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** 매매 당시 1g 기준 가격 (원) */
  pricePerGram: number
  /** 매매 수량 (g) */
  grams: number
  type: TradeType
  memo?: string
}


// -----------------------------------------------------------------------------
// 🪙 코인 (Crypto)
// -----------------------------------------------------------------------------

/** 단일 코인 매매 기록 */
export interface CryptoTradeRecord {
  id: string
  /** YYYY-MM-DD */
  date: string
  type: TradeType
  /** 매매 당시 단가 (USD) */
  price: number
  /** 수량 (소수점 가능) */
  quantity: number
  memo?: string
}

/** 보유 코인 한 종목 전체 */
export interface CryptoHolding {
  /** Yahoo Finance 심볼 (예: BTC-USD, ETH-USD) */
  symbol: string
  /** 표시 이름 (예: 비트코인) */
  name: string
  /** 코인 단위 (예: BTC) */
  unit: string
  trades: CryptoTradeRecord[]
}

/** 코인 포트폴리오 계산 결과 */
export interface CryptoStats {
  totalQuantity: number
  avgCostPrice: number
  totalInvested: number
  realizedPnl: number
}


// -----------------------------------------------------------------------------
// 🏠 부동산 (Real Estate)
// -----------------------------------------------------------------------------

export interface RealEstateHolding {
  id: string
  name: string
  address: string
  /** 취득가 (원) */
  acquisitionPrice: number
  /** YYYY-MM-DD */
  acquisitionDate: string
  /**
   * KB시세 또는 수동 입력 현재가 (원)
   * null이면 취득가로 대체 표시
   */
  currentEstimatedPrice: number | null
  /** 마지막 수동 업데이트 날짜 */
  priceUpdatedAt: string | null
}


// -----------------------------------------------------------------------------
// 👤 유저 프로필 & XP 시스템 (User Profile & Experience)
// -----------------------------------------------------------------------------

/** XP를 획득하는 이벤트의 출처 */
export type XpSource = "quiz_correct" | "quiz_bonus" | "daily_login" | "admin"

/** XP 획득 이력 단건 */
export interface XpEvent {
  id: string
  source: XpSource
  amount: number
  label: string
  /** ISO 8601 */
  earnedAt: string
}

/** 유저 레벨 메타 정보 */
export interface LevelMeta {
  level: number
  title: string
  /** 이 레벨에 진입하는 데 필요한 누적 XP */
  minXp: number
  /** 다음 레벨 진입에 필요한 누적 XP */
  maxXp: number
  /** 아이콘 이모지 */
  icon: string
}

/** 유저 프로필 전체 */
export interface UserProfile {
  id: string
  nickname: string
  email: string
  joinedAt: string
  totalXp: number
  xpHistory: XpEvent[]
  avatarEmoji: string
  portfolioPublic: boolean
}


// -----------------------------------------------------------------------------
// 🔖 활동 내역 (Article Activity)
// 북마크 / 좋아요 / 싫어요한 기사들을 마이페이지에서 모아볼 수 있도록 합니다.
// -----------------------------------------------------------------------------

export type ArticleReactionType = "like" | "dislike"

/** 북마크된 기사 */
export interface SavedArticle {
  newsId: string
  savedAt: string
  /** 기사 스냅샷 — 원본이 삭제되어도 보여줄 수 있도록 */
  snapshot: {
    headline: string
    category: NewsCategory
    timeAgo: string
    tags: string[]
  }
}

/** 좋아요 / 싫어요한 기사 */
export interface ArticleReaction {
  newsId: string
  type: ArticleReactionType
  reactedAt: string
  snapshot: {
    headline: string
    category: NewsCategory
    timeAgo: string
  }
}


// -----------------------------------------------------------------------------
// 📬 문의하기 (Inquiry)
// -----------------------------------------------------------------------------

export type InquiryStatus = "pending" | "in_review" | "resolved"
export type InquiryCategory = "bug" | "feature" | "account" | "data" | "other"

export interface InquiryMessage {
  id: string
  category: InquiryCategory
  title: string
  body: string
  submittedAt: string
  status: InquiryStatus
  /** 운영자 답변 (있을 경우) */
  reply?: string
}


// -----------------------------------------------------------------------------
// 🏘️ 커뮤니티 (Community)
// -----------------------------------------------------------------------------

export type CommunityCategory = "free" | "economy"

/** 게시글 단일 아이템 */
export interface CommunityPost {
  id: string
  category: CommunityCategory
  /** 해시태그 배열 (예: ["금리", "연준"]) */
  tags: string[]
  title: string
  content: string
  /** 작성자 정보 (스냅샷 — 유저가 닉네임 변경해도 게시글은 유지) */
  authorId: string
  authorNickname: string
  authorEmoji: string
  authorLevel: number
  publishedAt: string
  /** ISO 8601 상대 표시용 */
  timeAgo: string
  likeCount: number
  dislikeCount: number
  commentCount: number
  /** 삭제된 게시글 여부 (소프트 딜리트) */
  isDeleted: boolean
}

/** 게시글 댓글 */
export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  authorNickname: string
  authorEmoji: string
  authorLevel: number
  content: string
  publishedAt: string
  timeAgo: string
  likeCount: number
  dislikeCount: number
  /** 신고 횟수 */
  reportCount: number
  /** 관리자에 의해 삭제된 경우 → "신고에 의해 삭제된 댓글입니다." 표시 */
  isRemovedByAdmin: boolean
}

/** 댓글 신고 사유 */
export type CommentReportReason =
  | "spam"
  | "hate"
  | "sexual"
  | "violence"
  | "misinformation"
  | "other"

/** 댓글 신고 레코드 */
export interface CommentReport {
  commentId: string
  postId: string
  reason: CommentReportReason
  detail?: string
  reportedAt: string
}

// -----------------------------------------------------------------------------
// 👥 팔로우 (Follow)
// -----------------------------------------------------------------------------

export interface FollowRelation {
  followerId: string
  followingId: string
  followedAt: string
  /** 팔로잉 유저 정보 스냅샷 */
  targetNickname: string
  targetEmoji: string
  targetLevel: number
}