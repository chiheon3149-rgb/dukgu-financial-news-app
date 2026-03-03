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
  viewCount: number
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
  id?: string // 💡 Supabase 고유 ID
  ticker: string
  name: string
  currency: "KRW" | "USD"
  trades: TradeRecord[]
  dividends: DividendRecord[]
  accountId?: string // 💡 계좌 간 데이터 분리를 위한 핵심 필드
}

/** 평단가 및 보유 수량 계산 결과 */
export interface PortfolioStats {
  totalShares: number
  avgCostPrice: number
  totalInvested: number
  realizedPnl: number
}

/** API에서 가져온 실시간 시세 */
export interface MarketQuote {
  ticker: string
  name?: string      // 💡 [추가] 종목 검색 시 표시용
  currentPrice: number
  change?: number    // 💡 [추가] 변동 금액
  changePercent: number // 💡 [핵심 추가] 타입 에러 해결을 위한 등락률 필드
  currency: "KRW" | "USD"
  changeStatus: ChangeStatus
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
  date: string
  pricePerGram: number
  grams: number
  type: TradeType
  memo?: string
}


// -----------------------------------------------------------------------------
// 🪙 코인 (Crypto)
// -----------------------------------------------------------------------------

export interface CryptoTradeRecord {
  id: string
  date: string
  type: TradeType
  price: number
  quantity: number
  memo?: string
}

export interface CryptoHolding {
  symbol: string
  name: string
  unit: string
  trades: CryptoTradeRecord[]
}

export interface CryptoStats {
  totalQuantity: number
  avgCostPrice: number
  totalInvested: number
  realizedPnl: number
}


// -----------------------------------------------------------------------------
// 🏠 부동산 (Real Estate)
// -----------------------------------------------------------------------------

/** 상환 방식: level(원리금균등), principal(원금균등), graduated(채증식) */
export type RepaymentType = "level" | "principal" | "graduated"

export interface RealEstateHolding {
  id: string
  user_id: string
  asset_type: string              // 부동산 종류 (apartment, villa 등)
  name: string
  address: string | null
  exclusive_area: number | null     // 💡 [추가] 국토부 API 연동을 위한 전용면적 (m2)
  acquisition_price: number
  acquisition_date: string
  current_estimated_price: number | null
  
  // 🏢 국토부 실거래가 API 연동 필드 (추가됨)
  legal_dong_code: string | null    // 법정동 코드
  last_deal_price: number | null    // 최근 실거래가
  price_history: { date: string; price: number }[] // 시세 추이 히스토리

  // 💰 대출 상세 필드 (새로 추가됨)
  loan_amount: number              // 대출 원금
  loan_repayment_type: RepaymentType | null // 상환 방식
  loan_interest_rate: number | null // 금리 (%)
  loan_start_date: string | null    // 대출 시작일
  loan_end_date: string | null      // 대출 만기일
  loan_grace_period_months: number // 거치 기간 (개월)
  
  price_updated_at: string | null
  created_at?: string
  updated_at?: string
}


// -----------------------------------------------------------------------------
// 👤 유저 프로필 & XP 시스템 (User Profile & Experience)
// -----------------------------------------------------------------------------

export type XpSource = "quiz_correct" | "quiz_bonus" | "daily_login" | "admin"

export interface XpEvent {
  id: string
  source: XpSource
  amount: number
  label: string
  earnedAt: string
}

export interface LevelMeta {
  level: number
  title: string
  minXp: number
  maxXp: number
  icon: string
}

export interface UserProfile {
  id: string
  nickname: string
  email: string
  joinedAt: string
  totalXp: number
  xpHistory: XpEvent[]
  avatarEmoji: string
  portfolioPublic: boolean
  is_admin?: boolean 
}


// -----------------------------------------------------------------------------
// 🔖 활동 내역 (Article Activity)
// -----------------------------------------------------------------------------

export type ArticleReactionType = "like" | "dislike"

export interface SavedArticle {
  newsId: string
  savedAt: string
  snapshot: {
    headline: string
    category: NewsCategory
    timeAgo: string
    tags: string[]
  }
}

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
  tags: string[]
  title: string
  content: string
  authorId: string | null 
  authorNickname: string
  authorEmoji: string
  authorLevel: number
  publishedAt: string
  timeAgo: string
  likeCount: number
  dislikeCount: number
  commentCount: number
  viewCount: number 
  isDeleted: boolean
}

/** 게시글 댓글 */
export interface CommunityComment {
  id: string
  postId: string
  authorId: string | null 
  authorNickname: string
  authorEmoji: string
  authorLevel: number
  content: string
  publishedAt: string
  timeAgo: string
  likeCount: number
  dislikeCount: number
  reportCount: number
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
  targetNickname: string
  targetEmoji: string
  targetLevel: number
}