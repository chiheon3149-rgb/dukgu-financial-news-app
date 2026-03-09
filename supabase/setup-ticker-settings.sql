-- =============================================================================
-- 📌 user_ticker_settings — 사용자별 티커바 설정 저장
--
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_ticker_settings (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings  JSONB        NOT NULL DEFAULT '{"customNames":{},"hiddenSymbols":[],"customTickers":[]}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_ticker_settings ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기/쓰기 가능
CREATE POLICY "own settings" ON public.user_ticker_settings
  FOR ALL USING (auth.uid() = user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_ticker_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticker_settings_updated_at
  BEFORE UPDATE ON public.user_ticker_settings
  FOR EACH ROW EXECUTE FUNCTION update_ticker_settings_updated_at();
