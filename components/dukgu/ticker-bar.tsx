export function TickerBar() {
  return (
    <>
      {/* 이 부품 전용 애니메이션 모터 */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
      `}</style>

      <div className="bg-muted/50 py-1.5 border-b overflow-hidden relative flex items-center">
        <p className="text-xs text-muted-foreground whitespace-nowrap animate-marquee font-medium">
          📈 USD/KRW 1,340.5 &nbsp;&nbsp;|&nbsp;&nbsp; NASDAQ 16,230.5 [+] &nbsp;&nbsp;|&nbsp;&nbsp; KODEX 200 커버드콜 10,230 [+] &nbsp;&nbsp;|&nbsp;&nbsp; S&P 500 5,088.8 [+]
        </p>
      </div>
    </>
  )
}