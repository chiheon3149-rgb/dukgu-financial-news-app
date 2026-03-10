-- ============================================================
-- 1. 목업 시드 데이터 삭제
-- ============================================================
DELETE FROM public.vote_questions
WHERE question IN (
  '오늘 밤 비트코인 1억 재돌파 한다?',
  '이번 달 코스피 3,000 회복 가능?',
  'NVIDIA 이번 분기 사상 최고가 경신?'
);

-- ============================================================
-- 2. 관리자 INSERT 정책 추가
-- ============================================================
DROP POLICY IF EXISTS "admin insert questions" ON public.vote_questions;
CREATE POLICY "admin insert questions"
  ON public.vote_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================
-- 3. 관리자 DELETE 정책 추가
-- ============================================================
DROP POLICY IF EXISTS "admin delete questions" ON public.vote_questions;
CREATE POLICY "admin delete questions"
  ON public.vote_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
