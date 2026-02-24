-- =============================================================================
-- 👍 news_reactions 테이블 — 좋아요/싫어요 DB 트리거 방식
--
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 효과:
--   · 유저별 반응 1건만 허용 (PRIMARY KEY로 중복 방지)
--   · INSERT / UPDATE / DELETE 시 트리거가 news.good_count / bad_count 원자적 갱신
--   · 동시 접속 500명 환경에서도 race condition 없음
-- =============================================================================


-- ① news_reactions 테이블 생성
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_reactions (
  news_id    TEXT        NOT NULL,
  user_key   TEXT        NOT NULL,   -- profile.id (로그인) 또는 익명 device UUID
  reaction   TEXT        NOT NULL    CHECK (reaction IN ('good', 'bad')),
  created_at TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  PRIMARY KEY (news_id, user_key)
);


-- ② RLS 설정 (비로그인 포함 전체 허용)
-- ------------------------------------------------------------------------------
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_reactions_select" ON public.news_reactions
  FOR SELECT USING (true);

CREATE POLICY "news_reactions_insert" ON public.news_reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "news_reactions_update" ON public.news_reactions
  FOR UPDATE USING (true);

CREATE POLICY "news_reactions_delete" ON public.news_reactions
  FOR DELETE USING (true);


-- ③ 기존 카운트 초기화 (구 시스템은 race condition으로 부정확 → 클린 스타트)
-- ------------------------------------------------------------------------------
UPDATE public.news SET good_count = 0, bad_count = 0;


-- ④ 트리거 함수
-- ------------------------------------------------------------------------------
-- INSERT  : 반응 추가 → 해당 카운트 +1
-- DELETE  : 반응 제거 → 해당 카운트 -1 (최소 0)
-- UPDATE  : 반응 전환(good↔bad) → 각각 +1 / -1 원자적 처리
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_news_reaction_count()
RETURNS TRIGGER AS $$
BEGIN

  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction = 'good' THEN
      UPDATE public.news SET good_count = good_count + 1 WHERE id = NEW.news_id;
    ELSE
      UPDATE public.news SET bad_count  = bad_count  + 1 WHERE id = NEW.news_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction = 'good' THEN
      UPDATE public.news SET good_count = GREATEST(good_count - 1, 0) WHERE id = OLD.news_id;
    ELSE
      UPDATE public.news SET bad_count  = GREATEST(bad_count  - 1, 0) WHERE id = OLD.news_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- 같은 반응이면 무시
    IF OLD.reaction = NEW.reaction THEN RETURN NULL; END IF;

    IF NEW.reaction = 'good' THEN
      -- bad → good
      UPDATE public.news
        SET good_count = good_count + 1,
            bad_count  = GREATEST(bad_count - 1, 0)
        WHERE id = NEW.news_id;
    ELSE
      -- good → bad
      UPDATE public.news
        SET bad_count  = bad_count  + 1,
            good_count = GREATEST(good_count - 1, 0)
        WHERE id = NEW.news_id;
    END IF;

  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ⑤ 트리거 등록 (중복 방지: 먼저 삭제 후 재생성)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_news_reaction_count ON public.news_reactions;

CREATE TRIGGER trg_sync_news_reaction_count
AFTER INSERT OR UPDATE OR DELETE ON public.news_reactions
FOR EACH ROW EXECUTE FUNCTION sync_news_reaction_count();


-- 확인 쿼리 (선택)
-- SELECT news_id, reaction, COUNT(*) FROM public.news_reactions GROUP BY news_id, reaction;
-- SELECT id, headline, good_count, bad_count FROM public.news ORDER BY good_count DESC LIMIT 10;
