-- =============================================================================
-- 뉴스 테이블 개편: tickers 컬럼 추가 + impact_type/impact_keyword 확인
-- 실행: Supabase 대시보드 SQL Editor에서 실행
-- =============================================================================

-- 1. tickers 배열 컬럼 추가 (이미 있으면 무시)
ALTER TABLE news ADD COLUMN IF NOT EXISTS tickers TEXT[] DEFAULT '{}';

-- 2. impact_type / impact_keyword 컬럼 확인 (없으면 추가)
ALTER TABLE news ADD COLUMN IF NOT EXISTS impact_type TEXT CHECK (impact_type IN ('hot','cold','neutral')) DEFAULT NULL;
ALTER TABLE news ADD COLUMN IF NOT EXISTS impact_keyword TEXT DEFAULT NULL;

-- 3. (선택) 기존 summary 컬럼 유지 - body_summary(content)의 첫 100자 자동 동기화
-- 필요 시 아래 주석 해제
-- UPDATE news SET summary = LEFT(content, 100) WHERE summary IS NULL OR summary = '';

-- 4. Python AI 스크립트에서 삽입할 때 사용하는 컬럼 매핑 안내 (주석)
-- JSON field         → DB column
-- category           → category        (정치|경제|사회|문화|IT)
-- source             → source          (언론사명)
-- market_classification → market       (공통→common, 한국→kr, 미국→us)
-- headline           → headline
-- source_url         → original_url
-- ai_summary         → ai_summary
-- body_summary       → content         (+ summary = LEFT(body_summary, 100))
-- issue_badge        → impact_type     (호재→hot, 악재→cold, 중립→neutral, 표시안함→null)
-- tickers            → tickers         (text[])
-- tags               → tags            (text[])
