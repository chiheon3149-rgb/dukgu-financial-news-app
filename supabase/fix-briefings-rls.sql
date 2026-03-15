-- ============================================================
-- briefings 테이블 RLS 정책 재정비
-- 기존 정책이 충돌하거나 USING 절이 잘못 설정된 경우 수정
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 기존 정책 전부 제거
DROP POLICY IF EXISTS "admin_update_briefings"  ON public.briefings;
DROP POLICY IF EXISTS "briefings_select"        ON public.briefings;
DROP POLICY IF EXISTS "briefings_all_admin"     ON public.briefings;
DROP POLICY IF EXISTS "briefings_insert_admin"  ON public.briefings;
DROP POLICY IF EXISTS "briefings_update_admin"  ON public.briefings;
DROP POLICY IF EXISTS "briefings_delete_admin"  ON public.briefings;

-- ① 전체 공개 SELECT
CREATE POLICY "briefings_select"
  ON public.briefings FOR SELECT
  USING (true);

-- ② 관리자 INSERT
CREATE POLICY "briefings_insert_admin"
  ON public.briefings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::uuid = auth.uid() AND is_admin = true
    )
  );

-- ③ 관리자 UPDATE (soft-delete 포함)
CREATE POLICY "briefings_update_admin"
  ON public.briefings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::uuid = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::uuid = auth.uid() AND is_admin = true
    )
  );

-- ④ 관리자 DELETE
CREATE POLICY "briefings_delete_admin"
  ON public.briefings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::uuid = auth.uid() AND is_admin = true
    )
  );
