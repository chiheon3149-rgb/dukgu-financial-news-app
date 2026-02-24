-- =============================================================================
-- 🏘️ 커뮤니티 DB 트리거 설정
--
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 포함 내용:
--   ① community_post_reactions     : 게시글 반응 테이블 + 트리거
--   ② community_comment_reactions  : 댓글 반응 테이블 + 트리거
--   ③ community_comments 트리거    : 게시글 comment_count 자동 동기화
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- ① 게시글 반응 (like/dislike) 테이블 + 트리거
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  post_id    TEXT        NOT NULL,
  user_key   TEXT        NOT NULL,   -- profile.id (로그인) 또는 device UUID (익명)
  reaction   TEXT        NOT NULL    CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  PRIMARY KEY (post_id, user_key)
);

ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpr_select" ON public.community_post_reactions FOR SELECT USING (true);
CREATE POLICY "cpr_insert" ON public.community_post_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "cpr_update" ON public.community_post_reactions FOR UPDATE USING (true);
CREATE POLICY "cpr_delete" ON public.community_post_reactions FOR DELETE USING (true);

-- 기존 카운트 초기화
UPDATE public.community_posts SET like_count = 0, dislike_count = 0;

-- 트리거 함수
CREATE OR REPLACE FUNCTION sync_community_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction = 'like' THEN
      UPDATE public.community_posts SET like_count    = like_count    + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.community_posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction = 'like' THEN
      UPDATE public.community_posts SET like_count    = GREATEST(like_count    - 1, 0) WHERE id = OLD.post_id;
    ELSE
      UPDATE public.community_posts SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.post_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction = NEW.reaction THEN RETURN NULL; END IF;
    IF NEW.reaction = 'like' THEN
      UPDATE public.community_posts
        SET like_count    = like_count    + 1,
            dislike_count = GREATEST(dislike_count - 1, 0)
        WHERE id = NEW.post_id;
    ELSE
      UPDATE public.community_posts
        SET dislike_count = dislike_count + 1,
            like_count    = GREATEST(like_count    - 1, 0)
        WHERE id = NEW.post_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_community_post_reaction_count ON public.community_post_reactions;
CREATE TRIGGER trg_sync_community_post_reaction_count
AFTER INSERT OR UPDATE OR DELETE ON public.community_post_reactions
FOR EACH ROW EXECUTE FUNCTION sync_community_post_reaction_count();


-- ─────────────────────────────────────────────────────────────────────────────
-- ② 댓글 반응 (like/dislike) 테이블 + 트리거
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_comment_reactions (
  comment_id TEXT        NOT NULL,
  user_key   TEXT        NOT NULL,
  reaction   TEXT        NOT NULL    CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_key)
);

ALTER TABLE public.community_comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccr_select" ON public.community_comment_reactions FOR SELECT USING (true);
CREATE POLICY "ccr_insert" ON public.community_comment_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "ccr_update" ON public.community_comment_reactions FOR UPDATE USING (true);
CREATE POLICY "ccr_delete" ON public.community_comment_reactions FOR DELETE USING (true);

-- 기존 댓글 반응 카운트 초기화
UPDATE public.community_comments SET like_count = 0, dislike_count = 0;

CREATE OR REPLACE FUNCTION sync_community_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction = 'like' THEN
      UPDATE public.community_comments SET like_count    = like_count    + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.community_comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction = 'like' THEN
      UPDATE public.community_comments SET like_count    = GREATEST(like_count    - 1, 0) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.community_comments SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction = NEW.reaction THEN RETURN NULL; END IF;
    IF NEW.reaction = 'like' THEN
      UPDATE public.community_comments
        SET like_count    = like_count    + 1,
            dislike_count = GREATEST(dislike_count - 1, 0)
        WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.community_comments
        SET dislike_count = dislike_count + 1,
            like_count    = GREATEST(like_count    - 1, 0)
        WHERE id = NEW.comment_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_community_comment_reaction_count ON public.community_comment_reactions;
CREATE TRIGGER trg_sync_community_comment_reaction_count
AFTER INSERT OR UPDATE OR DELETE ON public.community_comment_reactions
FOR EACH ROW EXECUTE FUNCTION sync_community_comment_reaction_count();


-- ─────────────────────────────────────────────────────────────────────────────
-- ③ community_comments → community_posts.comment_count 자동 동기화 트리거
-- ─────────────────────────────────────────────────────────────────────────────

-- 기존 comment_count 백필 (이미 작성된 댓글 수 반영)
UPDATE public.community_posts p
SET comment_count = (
  SELECT COUNT(*)
  FROM public.community_comments c
  WHERE c.post_id = p.id
);

CREATE OR REPLACE FUNCTION sync_community_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_community_comment_count ON public.community_comments;
CREATE TRIGGER trg_sync_community_comment_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION sync_community_comment_count();


-- 확인 쿼리 (선택)
-- SELECT id, title, like_count, dislike_count, comment_count FROM public.community_posts LIMIT 10;
