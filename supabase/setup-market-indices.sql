-- =============================================================================
-- 🏗️ market_indices 테이블 설정 스크립트
--
-- Supabase 대시보드 > SQL Editor 에서 순서대로 실행하세요.
-- =============================================================================


-- ① 테이블 생성
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_indices (
  symbol        TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  price         NUMERIC     NOT NULL DEFAULT 0,
  change        NUMERIC     NOT NULL DEFAULT 0,
  change_rate   NUMERIC     NOT NULL DEFAULT 0,
  change_status TEXT        NOT NULL DEFAULT 'same'
                            CHECK (change_status IN ('up', 'down', 'same')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ② RLS(Row Level Security) 설정
-- ------------------------------------------------------------------------------
ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(anon 포함) 읽기 허용 — Realtime 구독에 필요
CREATE POLICY "Anyone can read market_indices"
  ON public.market_indices
  FOR SELECT
  USING (true);

-- 쓰기는 Edge Function이 service_role 키로 수행하므로 별도 정책 불필요


-- ③ Supabase Realtime 활성화
-- ------------------------------------------------------------------------------
-- 테이블 변경(INSERT / UPDATE)을 클라이언트가 실시간으로 구독하게 합니다.
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_indices;


-- ④ 초기 데이터 (선택 사항 — Edge Function이 첫 실행 전에 UI가 뜨도록)
-- ------------------------------------------------------------------------------
INSERT INTO public.market_indices (symbol, name, price, change, change_rate, change_status, updated_at)
VALUES
  ('^DJI',  '다우존스',   0, 0, 0, 'same', NOW()),
  ('^NDX',  '나스닥100',  0, 0, 0, 'same', NOW()),
  ('^GSPC', 'S&P500',     0, 0, 0, 'same', NOW()),
  ('^RUT',  '러셀2000',   0, 0, 0, 'same', NOW()),
  ('^KS11', '코스피',     0, 0, 0, 'same', NOW()),
  ('^KQ11', '코스닥',     0, 0, 0, 'same', NOW()),
  ('KRW=X', 'USD/KRW',   0, 0, 0, 'same', NOW())
ON CONFLICT (symbol) DO NOTHING;


-- ⑤ pg_cron + pg_net 으로 Edge Function 주기 호출 등록
-- ------------------------------------------------------------------------------
-- 사전 조건:
--   - Supabase 대시보드 > Database > Extensions 에서
--     [pg_cron]과 [pg_net] 이 활성화되어 있어야 합니다.
--
-- 아래 두 값을 실제 값으로 교체 후 실행하세요:
--   · YOUR_PROJECT_REF  →  Supabase 프로젝트 레퍼런스 ID
--                          (Settings > General > Reference ID)
--   · YOUR_SERVICE_ROLE_KEY  →  Settings > API > service_role 키
--
-- 스케줄: 매 1분마다 실행 (장 마감 후에는 변동 없음)
-- ------------------------------------------------------------------------------

SELECT cron.schedule(
  'fetch-market-indices',     -- 작업 이름 (중복 불가)
  '*/1 * * * *',              -- 매 1분마다
  $$
  SELECT net.http_post(
    url     := 'https://xzfnavxkpwsrmuyyklzr.supabase.co/functions/v1/fetch-market-indices',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Zm5hdnhrcHdzcm11eXlrbHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjU3NzEsImV4cCI6MjA4NzM0MTc3MX0.oA3sm_vOvhXRWFArlgNWz3aunJx_onIxCDIt4ewJEqQ'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- cron 작업 확인
-- SELECT * FROM cron.job;

-- cron 작업 삭제 (재등록이 필요할 때)
-- SELECT cron.unschedule('fetch-market-indices');
