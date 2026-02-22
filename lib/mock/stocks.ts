import type { StockHolding, GoldHolding } from "@/types"

// =============================================================================
// 📈 주식 / 금 목(Mock) 데이터
// 실제 서비스에서는 Supabase에서 불러옵니다.
// useStockPortfolio, useGoldPortfolio 훅 외에는 이 파일을 직접 import하지 않습니다.
// =============================================================================

export const MOCK_STOCK_HOLDINGS: StockHolding[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
    trades: [
      { id: "t-001", date: "2024-03-15", type: "buy",  price: 172.5,  quantity: 10 },
      { id: "t-002", date: "2024-06-20", type: "buy",  price: 185.0,  quantity: 5  },
      { id: "t-003", date: "2024-09-10", type: "sell", price: 220.0,  quantity: 3  },
      { id: "t-004", date: "2025-01-08", type: "buy",  price: 230.5,  quantity: 8  },
    ],
    dividends: [
      { id: "d-001", date: "2024-05-16", amountPerShare: 0.25, sharesHeld: 15, currency: "USD" },
      { id: "d-002", date: "2024-08-15", amountPerShare: 0.25, sharesHeld: 15, currency: "USD" },
      { id: "d-003", date: "2024-11-14", amountPerShare: 0.25, sharesHeld: 12, currency: "USD" },
    ],
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    currency: "USD",
    trades: [
      { id: "t-005", date: "2024-01-10", type: "buy", price: 495.0,  quantity: 4 },
      { id: "t-006", date: "2024-04-22", type: "buy", price: 762.0,  quantity: 2 },
      { id: "t-007", date: "2024-07-15", type: "buy", price: 117.5,  quantity: 20, memo: "주식 분할 후 추가 매수" },
    ],
    dividends: [
      { id: "d-004", date: "2024-06-28", amountPerShare: 0.01, sharesHeld: 6, currency: "USD" },
    ],
  },
  {
    ticker: "005930.KS",
    name: "삼성전자",
    currency: "KRW",
    trades: [
      { id: "t-008", date: "2023-11-03", type: "buy",  price: 68_000, quantity: 50 },
      { id: "t-009", date: "2024-02-14", type: "buy",  price: 72_500, quantity: 30 },
      { id: "t-010", date: "2024-08-05", type: "sell", price: 65_000, quantity: 20, memo: "일부 손절" },
    ],
    dividends: [
      { id: "d-005", date: "2024-04-20", amountPerShare: 361, sharesHeld: 80, currency: "KRW" },
      { id: "d-006", date: "2024-10-18", amountPerShare: 361, sharesHeld: 60, currency: "KRW" },
    ],
  },
  {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    currency: "USD",
    trades: [
      { id: "t-011", date: "2023-09-01", type: "buy", price: 385.0, quantity: 5  },
      { id: "t-012", date: "2024-01-15", type: "buy", price: 432.0, quantity: 3  },
      { id: "t-013", date: "2024-06-03", type: "buy", price: 495.0, quantity: 4  },
    ],
    dividends: [
      { id: "d-007", date: "2024-03-28", amountPerShare: 1.68, sharesHeld: 8, currency: "USD" },
      { id: "d-008", date: "2024-06-28", amountPerShare: 1.72, sharesHeld: 12, currency: "USD" },
    ],
  },
]

export const MOCK_GOLD_HOLDINGS: GoldHolding[] = [
  { id: "g-001", date: "2023-05-10", pricePerGram: 82_000, grams: 50,  type: "buy"  },
  { id: "g-002", date: "2023-11-22", pricePerGram: 88_500, grams: 30,  type: "buy"  },
  { id: "g-003", date: "2024-04-15", pricePerGram: 102_000, grams: 20, type: "sell", memo: "일부 차익 실현" },
  { id: "g-004", date: "2024-09-08", pricePerGram: 115_000, grams: 40, type: "buy"  },
]
