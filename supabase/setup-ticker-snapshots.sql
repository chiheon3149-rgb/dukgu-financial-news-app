-- ticker_snapshots: 기사 발행 시점의 주가 스냅샷 (JSONB)
-- 구조: [{ symbol, price, price_fmt, change_pct, is_up, is_down, currency }]
-- 뉴스봇이 기사 수집 시 자동으로 채워줍니다.

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS ticker_snapshots JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN news.ticker_snapshots IS
  '발행 시점 주가 스냅샷. 예: [{"symbol":"AAPL","price":182.5,"price_fmt":"$182.50","change_pct":"+2.34%","is_up":true,"is_down":false,"currency":"USD"}]';
