-- =============================================================================
-- 🔖 news_reactions — 마이페이지 활동내역 연동을 위한 컬럼 추가
--
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 기존 news_reactions 테이블에 아래 3개 컬럼을 추가합니다:
--   · user_id   : 로그인 유저 ID (마이페이지에서 유저별 필터링용)
--   · snapshot  : 기사 스냅샷 JSON (마이페이지 표시용 — {headline, category, timeAgo})
--   · reacted_at: 반응 시각 (마이페이지 정렬용)
--
-- 기존 트리거(good_count/bad_count 동기화)는 변경 없이 유지됩니다.
-- =============================================================================

ALTER TABLE public.news_reactions
  ADD COLUMN IF NOT EXISTS user_id    UUID        NULL,
  ADD COLUMN IF NOT EXISTS snapshot   JSONB       NULL,
  ADD COLUMN IF NOT EXISTS reacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 확인 쿼리 (선택)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'news_reactions' ORDER BY ordinal_position;
