-- ============================================================
-- vote_questions 테이블: 날짜별 투표 질문
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vote_questions (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT    NOT NULL,
  active_date DATE    UNIQUE,          -- 이 날짜에 표시될 질문
  o_count     INTEGER NOT NULL DEFAULT 0,
  x_count     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- vote_responses 테이블: 중복 투표 방지용 응답 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vote_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.vote_questions(id) ON DELETE CASCADE,
  user_key    TEXT NOT NULL,            -- localStorage에 저장된 랜덤 UUID
  choice      TEXT NOT NULL CHECK (choice IN ('O', 'X')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_id, user_key)        -- 같은 질문에 중복 투표 불가
);

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE public.vote_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_responses  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read questions"   ON public.vote_questions;
CREATE POLICY "public read questions"
  ON public.vote_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "public read responses"   ON public.vote_responses;
CREATE POLICY "public read responses"
  ON public.vote_responses FOR SELECT USING (true);

DROP POLICY IF EXISTS "public insert responses" ON public.vote_responses;
CREATE POLICY "public insert responses"
  ON public.vote_responses FOR INSERT WITH CHECK (true);

-- ============================================================
-- cast_vote() 함수
-- SECURITY DEFINER: RLS 우회하여 카운트 안전하게 증가
-- unique_violation 예외 처리로 중복 투표 감지
-- ============================================================
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_question_id UUID,
  p_user_key    TEXT,
  p_choice      TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_o INTEGER;
  v_x INTEGER;
BEGIN
  -- 응답 삽입 (중복이면 unique_violation 예외 발생)
  INSERT INTO public.vote_responses (question_id, user_key, choice)
  VALUES (p_question_id, p_user_key, p_choice);

  -- 해당 항목 카운트 증가
  IF p_choice = 'O' THEN
    UPDATE public.vote_questions
      SET o_count = o_count + 1
      WHERE id = p_question_id
      RETURNING o_count, x_count INTO v_o, v_x;
  ELSE
    UPDATE public.vote_questions
      SET x_count = x_count + 1
      WHERE id = p_question_id
      RETURNING o_count, x_count INTO v_o, v_x;
  END IF;

  RETURN jsonb_build_object('o_count', v_o, 'x_count', v_x, 'already_voted', false);

EXCEPTION WHEN unique_violation THEN
  -- 이미 투표한 유저: 현재 카운트만 반환
  SELECT o_count, x_count INTO v_o, v_x
    FROM public.vote_questions WHERE id = p_question_id;
  RETURN jsonb_build_object('o_count', v_o, 'x_count', v_x, 'already_voted', true);
END;
$$;

-- ============================================================
-- 초기 질문 데이터 (오늘~모레 3일치)
-- ============================================================
INSERT INTO public.vote_questions (question, active_date, o_count, x_count) VALUES
  ('오늘 밤 비트코인 1억 재돌파 한다?',    CURRENT_DATE,     1349, 498),
  ('이번 달 코스피 3,000 회복 가능?',      CURRENT_DATE + 1, 949,  1365),
  ('NVIDIA 이번 분기 사상 최고가 경신?',   CURRENT_DATE + 2, 614,  289)
ON CONFLICT (active_date) DO NOTHING;
