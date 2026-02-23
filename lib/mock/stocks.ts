import type { StockHolding, GoldHolding } from "@/types"

// =============================================================================
// 📈 주식 / 금 목(Mock) 데이터
// 실제 서비스에서는 Supabase에서 불러옵니다.
// useStockPortfolio, useGoldPortfolio 훅 외에는 이 파일을 직접 import하지 않습니다.
// =============================================================================

export const MOCK_STOCK_HOLDINGS: StockHolding[] = []

export const MOCK_GOLD_HOLDINGS: GoldHolding[] = []
