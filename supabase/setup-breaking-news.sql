-- 속보 필드 추가
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT FALSE;

-- 속보 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_news_is_breaking ON news (is_breaking) WHERE is_breaking = TRUE;
