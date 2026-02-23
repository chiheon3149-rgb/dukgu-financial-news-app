import { StockPortfolioProvider } from "@/context/stock-portfolio-context"
import { CryptoPortfolioProvider } from "@/context/crypto-portfolio-context"

// 자산관리 섹션 전체에 Portfolio Context 를 제공합니다.
// /assets/** 아래의 모든 페이지(stocks, crypto, gold 등)가 같은 상태를 공유합니다.
export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StockPortfolioProvider>
      <CryptoPortfolioProvider>
        {children}
      </CryptoPortfolioProvider>
    </StockPortfolioProvider>
  )
}
