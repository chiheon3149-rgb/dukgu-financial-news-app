// =============================================================================
// 📦 증시 탭 가짜 데이터 창고
//
// 아직 실제 증시 API가 연결되기 전까지 사용하는 샘플 데이터예요.
// 나중에 실제 API가 생기면 이 파일의 데이터만 교체하면 됩니다!
// =============================================================================

// ── 타입 정의 ──────────────────────────────────────────────────────────────

/** 기본 종목 정보 */
export interface StockItem {
  ticker: string
  name: string
  market: "KR" | "US"
  currentPrice: number
  changeRate: number
  currency: "KRW" | "USD"
  color: string
  initial: string
}

/** 보유 종목 (내 지갑) */
export interface HoldingItem extends StockItem {
  quantity: number
  avgPrice: number
}

/** 시장 지수 */
export interface MarketIndex {
  name: string
  value: number
  changeRate: number
  positive: boolean
}

/** 오늘 급등 종목 */
export interface TopGainer {
  rank: number
  ticker: string
  name: string
  currentPrice: number
  changeRate: number
  currency: "KRW" | "USD"
  color: string
  initial: string
  reason: string
}

/** 주요 지표 타일 — 숫자 + 초보자 설명 포함 */
export interface StatTile {
  label: string   // 지표 이름 (예: 시가총액)
  value: string   // 실제 값 (예: 451조원)
  hint: string    // 💡 이 숫자가 뭔지 쉽게 설명해주는 텍스트
}

/** 관련 뉴스 아이템 */
export interface NewsItem {
  title: string
  timeAgo: string
}

/** 종목 상세 페이지 정보 */
export interface StockDetail {
  ticker: string
  name: string
  market: "KR" | "US"
  currentPrice: number
  changeRate: number
  changeAmount: number
  currency: "KRW" | "USD"
  color: string
  initial: string
  // 회사 소개 정보
  companyInfo: {
    listingDate: string
    mainBusiness: string
    ceo: string
  }
  description: string
  // 주요 지표 6개 (2×3 그리드)
  stats: StatTile[]
  // 관련 뉴스
  news: NewsItem[]
  // 차트 데이터
  chartData: Record<string, { price: number; time: string }[]>
}

// ── 보유 종목 목록 ─────────────────────────────────────────────────────────

export const MOCK_HOLDINGS: HoldingItem[] = [
  { ticker: "005930", name: "삼성전자", market: "KR", currentPrice: 75600, changeRate: 1.34, currency: "KRW", color: "#1428A0", initial: "삼", quantity: 10, avgPrice: 71000 },
  { ticker: "035420", name: "NAVER",   market: "KR", currentPrice: 188000, changeRate: -0.53, currency: "KRW", color: "#03C75A", initial: "N", quantity: 3, avgPrice: 195000 },
  { ticker: "AAPL",   name: "Apple",   market: "US", currentPrice: 213.5, changeRate: 1.02, currency: "USD", color: "#1C1C1E", initial: "A", quantity: 5, avgPrice: 178.0 },
  { ticker: "TSLA",   name: "Tesla",   market: "US", currentPrice: 186.2, changeRate: -2.14, currency: "USD", color: "#CC0000", initial: "T", quantity: 2, avgPrice: 210.0 },
]

// ── 관심 종목 목록 ─────────────────────────────────────────────────────────

export const MOCK_WATCHLIST: StockItem[] = [
  { ticker: "000660", name: "SK하이닉스", market: "KR", currentPrice: 198500, changeRate: 2.34,  currency: "KRW", color: "#EA0029", initial: "SK" },
  { ticker: "005380", name: "현대차",     market: "KR", currentPrice: 243000, changeRate: -1.12, currency: "KRW", color: "#002C5F", initial: "H"  },
  { ticker: "NVDA",   name: "NVIDIA",    market: "US", currentPrice: 875.4,  changeRate: 4.56,  currency: "USD", color: "#76B900", initial: "N"  },
  { ticker: "AMZN",   name: "Amazon",    market: "US", currentPrice: 186.7,  changeRate: 0.89,  currency: "USD", color: "#FF9900", initial: "A"  },
  { ticker: "MSFT",   name: "Microsoft", market: "US", currentPrice: 420.3,  changeRate: -0.34, currency: "USD", color: "#0078D4", initial: "M"  },
]

// ── 시장 지수 ──────────────────────────────────────────────────────────────

export const MOCK_INDICES: MarketIndex[] = [
  { name: "코스피",  value: 2687.44,  changeRate: 0.82,  positive: true  },
  { name: "코스닥",  value: 879.23,   changeRate: -0.31, positive: false },
  { name: "S&P500",  value: 5234.18,  changeRate: 1.12,  positive: true  },
  { name: "나스닥",  value: 16421.43, changeRate: 1.45,  positive: true  },
]

// ── 급등주 TOP3 ────────────────────────────────────────────────────────────

export const MOCK_TOP_GAINERS: TopGainer[] = [
  { rank: 1, ticker: "032640", name: "LG유플러스",  market: "KR", currentPrice: 12450,  changeRate: 8.92, currency: "KRW", color: "#E6007E", initial: "LG", reason: "5G 신규 투자 발표로 매수세 급증" },
  { rank: 2, ticker: "005490", name: "POSCO홀딩스", market: "KR", currentPrice: 389000, changeRate: 6.21, currency: "KRW", color: "#1A4592", initial: "P",  reason: "리튬 배터리 소재 공장 가동 소식" },
  { rank: 3, ticker: "PLTR",   name: "Palantir",   market: "US", currentPrice: 28.45,  changeRate: 5.87, currency: "USD", color: "#101113", initial: "P",  reason: "AI 국방 계약 수주 발표" },
]

// ── 차트 데이터 (정적 배열) ────────────────────────────────────────────────

const samsung1D = [73200,73500,73300,74000,74200,74800,74600,75000,74900,75200,75400,75600,75300,75500,75700,75600,75800,76000,75900,75700,75600,75800,76100,75600].map((p,i)=>({ price: p, time: `${i}시` }))
const samsung1W = [72000,73100,72800,73900,74500,75200,75600].map((p,i)=>({ price: p, time: `${i+1}일` }))
const samsung1M = [68000,69200,70100,70500,71200,72000,71500,72800,73500,74000,73800,74200,74900,75100,75600].map((p,i)=>({ price: p, time: `${i+1}일` }))
const samsung1Y = [60000,62000,61000,63500,65000,64000,67000,68500,70000,71000,73000,75600].map((p,i)=>({ price: p, time: `${i+1}월` }))

const aapl1D = [208.1,209.3,208.7,210.2,211.5,212.0,211.8,212.4,212.9,213.1,212.7,213.0,212.5,213.2,213.5,213.4,213.8,214.1,213.9,213.7,213.5,213.8,214.2,213.5].map((p,i)=>({ price: p, time: `${i}h` }))
const aapl1W = [200.5,204.2,203.8,207.1,209.4,211.2,213.5].map((p,i)=>({ price: p, time: `${i+1}d` }))
const aapl1M = [185.0,188.4,190.1,192.5,194.2,196.8,195.3,198.0,200.2,202.5,201.8,204.3,206.1,208.7,213.5].map((p,i)=>({ price: p, time: `${i+1}d` }))
const aapl1Y = [150.2,155.4,158.7,162.1,168.9,172.5,178.0,182.3,188.5,195.2,205.1,213.5].map((p,i)=>({ price: p, time: `${i+1}m` }))

// ── 종목 상세 데이터 ───────────────────────────────────────────────────────

export const MOCK_STOCK_DETAILS: Record<string, StockDetail> = {
  "005930": {
    ticker: "005930", name: "삼성전자", market: "KR",
    currentPrice: 75600, changeRate: 1.34, changeAmount: 1000,
    currency: "KRW", color: "#1428A0", initial: "삼",
    companyInfo: {
      listingDate: "1975년 6월 11일",
      mainBusiness: "스마트폰, 반도체, 가전제품",
      ceo: "한종희",
    },
    description: "삼성전자는 1969년에 세워진 대한민국 대표 기업이에요! 🤩 스마트폰, TV, 냉장고 같은 전자제품과 반도체 메모리를 전 세계에 팔고 있어요. '갤럭시' 스마트폰과 세계 1위 반도체로 특히 유명하답니다.",
    stats: [
      { label: "시가총액",    value: "451조원",   hint: "우리나라에서 가장 큰 회사예요" },
      { label: "PER",        value: "14.2배",    hint: "이익 대비 주가 수준을 알 수 있어요" },
      { label: "배당수익률",  value: "2.1%",     hint: "1년에 받을 수 있는 현금 선물이에요" },
      { label: "52주 최고",  value: "88,800원",  hint: "올해 가장 비쌌던 가격이에요" },
      { label: "52주 최저",  value: "58,900원",  hint: "올해 가장 저렴했던 가격이에요" },
      { label: "거래량",     value: "1,234만주",  hint: "오늘 이 주식이 거래된 횟수예요" },
    ],
    news: [
      { title: "삼성전자, 차세대 HBM4 양산 돌입... 엔비디아 공급 확대 기대감", timeAgo: "23분 전" },
      { title: "삼성전자 2분기 영업이익 10조 돌파... 반도체 회복세 뚜렷", timeAgo: "1시간 전" },
      { title: "삼성전자 갤럭시 AI 기능 전세계 2억대 확산... 소프트웨어 전략 강화", timeAgo: "3시간 전" },
    ],
    chartData: { "1일": samsung1D, "1주": samsung1W, "1달": samsung1M, "1년": samsung1Y },
  },

  "AAPL": {
    ticker: "AAPL", name: "Apple", market: "US",
    currentPrice: 213.5, changeRate: 1.02, changeAmount: 2.15,
    currency: "USD", color: "#1C1C1E", initial: "A",
    companyInfo: {
      listingDate: "1980년 12월 12일",
      mainBusiness: "아이폰, 맥북, 앱스토어, 서비스",
      ceo: "팀 쿡 (Tim Cook)",
    },
    description: "Apple은 1976년 미국 차고에서 탄생한 세계 최대 기업이에요! 🍎 아이폰, 맥북, 에어팟 같은 제품으로 전 세계 사람들의 일상을 바꿔놓았고, 전 세계에서 가장 가치 있는 회사 중 하나랍니다.",
    stats: [
      { label: "시가총액",    value: "$3.3조",    hint: "전 세계에서 손꼽히는 큰 회사예요" },
      { label: "PER",        value: "31.5배",    hint: "이익 대비 주가 수준을 알 수 있어요" },
      { label: "배당수익률",  value: "0.5%",     hint: "1년에 받을 수 있는 현금 선물이에요" },
      { label: "52주 최고",  value: "$220.2",    hint: "올해 가장 비쌌던 가격이에요" },
      { label: "52주 최저",  value: "$164.1",    hint: "올해 가장 저렴했던 가격이에요" },
      { label: "거래량",     value: "5,821만주",  hint: "오늘 이 주식이 거래된 횟수예요" },
    ],
    news: [
      { title: "Apple, 아이폰17 AI 카메라 기능 공개... 역대 최대 업그레이드 예고", timeAgo: "45분 전" },
      { title: "애플 서비스 매출 사상 최고치 경신... 앱스토어 수익 급증", timeAgo: "2시간 전" },
      { title: "애플, 인도 공장 확대로 아이폰 생산지 다변화 본격화", timeAgo: "4시간 전" },
    ],
    chartData: { "1일": aapl1D, "1주": aapl1W, "1달": aapl1M, "1년": aapl1Y },
  },
}

// 알 수 없는 티커의 기본값
export const MOCK_STOCK_DEFAULT: StockDetail = {
  ticker: "???", name: "알 수 없는 종목", market: "US",
  currentPrice: 100, changeRate: 0, changeAmount: 0,
  currency: "USD", color: "#94a3b8", initial: "?",
  companyInfo: { listingDate: "-", mainBusiness: "-", ceo: "-" },
  description: "이 종목에 대한 정보를 불러오고 있어요...",
  stats: [
    { label: "시가총액",    value: "-", hint: "-" },
    { label: "PER",        value: "-", hint: "-" },
    { label: "배당수익률",  value: "-", hint: "-" },
    { label: "52주 최고",  value: "-", hint: "-" },
    { label: "52주 최저",  value: "-", hint: "-" },
    { label: "거래량",     value: "-", hint: "-" },
  ],
  news: [],
  chartData: {
    "1일": [100,101,100,102,103,102,104,103,105,104,103,102,103,104,105,104,103,102,101,102,103,104,105,100].map((p,i)=>({ price: p, time: `${i}h` })),
    "1주": [100,101,102,101,103,104,100].map((p,i)=>({ price: p, time: `${i+1}d` })),
    "1달": [98,99,100,101,102,101,100,102,103,104,103,102,101,102,100].map((p,i)=>({ price: p, time: `${i+1}d` })),
    "1년": [90,92,94,96,98,100,99,101,103,104,102,100].map((p,i)=>({ price: p, time: `${i+1}m` })),
  },
}
