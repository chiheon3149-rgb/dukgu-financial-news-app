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
-- 2. 관리자 전용 투표 등록 함수 (SECURITY DEFINER로 RLS 우회)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_insert_vote_question(
  p_question    TEXT,
  p_active_date DATE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row public.vote_questions;
BEGIN
  -- 호출자가 관리자인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO public.vote_questions (question, active_date, o_count, x_count)
  VALUES (p_question, p_active_date, 0, 0)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id',          v_row.id,
    'question',    v_row.question,
    'active_date', v_row.active_date::text
  );
END;
$$;

-- ============================================================
-- 3. 관리자 전용 투표 삭제 함수 (SECURITY DEFINER로 RLS 우회)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_vote_question(
  p_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 호출자가 관리자인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  DELETE FROM public.vote_questions WHERE id = p_id;
END;
$$;
