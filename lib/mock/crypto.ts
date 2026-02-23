import type { CryptoHolding } from "@/types"

// =============================================================================
// 🪙 코인 Mock 데이터
// =============================================================================

export const MOCK_CRYPTO_HOLDINGS: CryptoHolding[] = [
  {
    symbol: "BTC-USD",
    name: "비트코인",
    unit: "BTC",
    trades: [
      { id: "ct-001", date: "2024-01-15", type: "buy",  price: 42000,  quantity: 0.05 },
      { id: "ct-002", date: "2024-04-10", type: "buy",  price: 68500,  quantity: 0.03 },
      { id: "ct-003", date: "2024-09-20", type: "sell", price: 62000,  quantity: 0.02 },
    ],
  },
  {
    symbol: "ETH-USD",
    name: "이더리움",
    unit: "ETH",
    trades: [
      { id: "ct-004", date: "2024-02-20", type: "buy",  price: 2800,   quantity: 1.5  },
      { id: "ct-005", date: "2024-07-15", type: "buy",  price: 3200,   quantity: 0.5  },
    ],
  },
  {
    symbol: "SOL-USD",
    name: "솔라나",
    unit: "SOL",
    trades: [
      { id: "ct-006", date: "2024-03-05", type: "buy",  price: 145,    quantity: 10   },
      { id: "ct-007", date: "2024-11-01", type: "buy",  price: 185,    quantity: 5    },
    ],
  },
]
