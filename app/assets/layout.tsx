import { StockPortfolioProvider } from "@/context/stock-portfolio-context"
import { CryptoPortfolioProvider } from "@/context/crypto-portfolio-context"
import Script from "next/script" // 💡 Next.js에서 제공하는 스크립트 도우미

// 자산관리 섹션 전체에 Portfolio Context 를 제공합니다.
// /assets/** 아래의 모든 페이지(stocks, crypto, gold 등)가 같은 상태를 공유합니다.
export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StockPortfolioProvider>
      <CryptoPortfolioProvider>
        {/* 💡 카카오 주소 검색 엔진을 로비(Layout)에 미리 배치합니다. 
            strategy="afterInteractive"는 페이지가 어느 정도 뜬 후에 
            조용히 불러오게 해서 전체적인 앱 속도를 방해하지 않게 해줍니다.
        */}
        <Script 
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" 
          strategy="afterInteractive" 
        />
        
        {children}
      </CryptoPortfolioProvider>
    </StockPortfolioProvider>
  )
}