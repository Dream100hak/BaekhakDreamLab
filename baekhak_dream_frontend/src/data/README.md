# 꿈 문장 크롤링 데이터

- `NaverArticle.xml` - 네이버 카페 크롤링
- `DaumArticle.xml` - 다음 카페 크롤링

## import 실행

1. **dream_sentences 테이블 생성**  
   Supabase Dashboard SQL Editor에서 `supabase/migrations/20250302000000_create_dream_sentences.sql` 실행

2. **import 스크립트 실행**
   ```bash
   npm run import-dreams
   ```
