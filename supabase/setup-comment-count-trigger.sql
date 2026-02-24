-- =============================================================================
-- 💬 news.comment_count 자동 동기화 트리거
--
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- news_comments 테이블에 댓글이 INSERT / DELETE 될 때
-- news.comment_count 컬럼을 자동으로 +1 / -1 합니다.
--
-- 장점:
--   · 앱 코드 실패 / 누락과 무관하게 DB 레벨에서 원자적으로 동기화
--   · 동시 접속 500명 환경에서도 PostgreSQL MVCC가 안전하게 처리
-- =============================================================================


-- ① comment_count 컬럼 추가 (이미 있으면 무시)
-- ------------------------------------------------------------------------------
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;


-- ② 기존 댓글 데이터 백필 (트리거 설치 전에 이미 작성된 댓글 수 반영)
-- ------------------------------------------------------------------------------
UPDATE public.news n
SET comment_count = (
  SELECT COUNT(*)
  FROM public.news_comments c
  WHERE c.news_id = n.id
);


-- ③ 트리거 함수
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_news_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news
    SET comment_count = comment_count + 1
    WHERE id = NEW.news_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.news_id;
  END IF;

  RETURN NULL; -- AFTER 트리거이므로 반환값 무시
END;
$$ LANGUAGE plpgsql;


-- ④ 트리거 등록 (중복 방지: 먼저 삭제 후 재생성)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_news_comment_count ON public.news_comments;

CREATE TRIGGER trg_sync_news_comment_count
AFTER INSERT OR DELETE ON public.news_comments
FOR EACH ROW EXECUTE FUNCTION sync_news_comment_count();


-- 확인 쿼리 (선택)
-- SELECT n.id, n.headline, n.comment_count, COUNT(c.id) AS actual
-- FROM public.news n
-- LEFT JOIN public.news_comments c ON c.news_id = n.id
-- GROUP BY n.id, n.headline, n.comment_count
-- ORDER BY n.comment_count DESC;
