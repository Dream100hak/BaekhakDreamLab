-- 꿈 해몽 사전 키워드 테이블 (hmznqcsrvvbdyemnvnqf 프로젝트용)
-- Supabase MCP apply 또는 Dashboard SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS public.dream_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  sense TEXT,
  nums INT[] NOT NULL DEFAULT '{}',
  star INT NOT NULL DEFAULT 0,
  end_digits INT[] DEFAULT '{}',
  finish_length_data INT[],
  finish_num_check INT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dream_keywords DROP CONSTRAINT IF EXISTS dream_keywords_word_sense_key;
ALTER TABLE public.dream_keywords ADD CONSTRAINT dream_keywords_word_sense_key UNIQUE (word, sense);

CREATE INDEX IF NOT EXISTS idx_dream_keywords_word ON public.dream_keywords (word);

COMMENT ON TABLE public.dream_keywords IS '꿈 해몽 사전: 키워드별 로또 번호 매핑';

ALTER TABLE public.dream_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dream_keywords_select_policy ON public.dream_keywords;
CREATE POLICY dream_keywords_select_policy ON public.dream_keywords FOR SELECT USING (true);

DROP POLICY IF EXISTS dream_keywords_insert_policy ON public.dream_keywords;
CREATE POLICY dream_keywords_insert_policy ON public.dream_keywords FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS dream_keywords_update_policy ON public.dream_keywords;
CREATE POLICY dream_keywords_update_policy ON public.dream_keywords FOR UPDATE USING (true);

DROP POLICY IF EXISTS dream_keywords_delete_policy ON public.dream_keywords;
CREATE POLICY dream_keywords_delete_policy ON public.dream_keywords FOR DELETE USING (true);
