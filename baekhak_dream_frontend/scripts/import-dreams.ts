/**
 * 네이버/다음 카페 XML → dream_sentences 테이블 일괄 import
 * 실행: npx tsx scripts/import-dreams.ts
 * 또는: node --loader ts-node/esm scripts/import-dreams.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
// .env.local 로드 (Next.js env 자동 로드는 스크립트에서 안 됨)
import { config } from "dotenv";
config({ path: join(process.cwd(), ".env.local") });

const BATCH_SIZE = 300;

type ArticleInfo = {
  "@_TITLE"?: string;
  "@_WRITER"?: string;
  "@_POST"?: string;
  "@_DATE"?: string;
};

function extractRound(title: string | undefined): number | null {
  if (!title) return null;
  const m = title.match(/(\d{3,4})회/);
  return m ? parseInt(m[1], 10) : null;
}

function parseXmlFile(filePath: string): ArticleInfo[] {
  const xml = readFileSync(filePath, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as {
    NaverArticle?: { ArticleInfo?: ArticleInfo | ArticleInfo[] };
    DaumArticle?: { ArticleInfo?: ArticleInfo | ArticleInfo[] };
  };
  const root = parsed.NaverArticle ?? parsed.DaumArticle;
  if (!root?.ArticleInfo) return [];
  const arr = Array.isArray(root.ArticleInfo) ? root.ArticleInfo : [root.ArticleInfo];
  return arr;
}

function toRow(
  a: ArticleInfo,
  source: "naver" | "daum"
): {
  source: string;
  title: string | null;
  writer: string | null;
  post: string;
  round_num: number | null;
  post_date: string | null;
} {
  const title = (a["@_TITLE"] ?? "").trim() || null;
  const post = (a["@_POST"] ?? "").trim();
  if (!post) throw new Error("POST is required");
  return {
    source,
    title,
    writer: (a["@_WRITER"] ?? "").trim() || null,
    post,
    round_num: extractRound(title),
    post_date: (a["@_DATE"] ?? "").trim() || null,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and key required in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const dataDir = join(process.cwd(), "src", "data");
  const naverPath = join(dataDir, "NaverArticle.xml");
  const daumPath = join(dataDir, "DaumArticle.xml");

  const allRows: ReturnType<typeof toRow>[] = [];

  for (const [filePath, source] of [
    [naverPath, "naver" as const],
    [daumPath, "daum" as const],
  ]) {
    try {
      const articles = parseXmlFile(filePath);
      for (const a of articles) {
        try {
          allRows.push(toRow(a, source));
        } catch {
          // skip invalid (empty POST)
        }
      }
      console.log(`[${source}] 파싱: ${articles.length}건`);
    } catch (e) {
      console.warn(`[${filePath}] 읽기 실패:`, e);
    }
  }

  if (allRows.length === 0) {
    console.log("저장할 데이터 없음");
    return;
  }

  console.log(`총 ${allRows.length}건 배치 삽입 시작 (${BATCH_SIZE}건/배치)`);

  let inserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("dream_sentences").insert(batch);
    if (error) {
      console.error(`배치 ${i / BATCH_SIZE + 1} 오류:`, error.message);
      break;
    }
    inserted += batch.length;
    if (inserted % 1500 === 0 || inserted === allRows.length) {
      console.log(`  ${inserted}/${allRows.length} 건 삽입 완료`);
    }
  }

  console.log(`완료: ${inserted}건 저장`);
}

main().catch(console.error);
