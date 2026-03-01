/**
 * 꿈 문장 분석 API
 * POST /api/dream/analyze
 * Body: { sentence: string }
 * - Gemini로 키워드 추출 (동음이의어 sense 구분)
 * - dream_keywords 조회 후 로또 번호 반환
 */

import { NextRequest, NextResponse } from "next/server";

import { extractKeywordsFromDream } from "@/lib/gemini/extract-keywords";
import { loadDictionary, lookupKeywords } from "@/lib/dream/dictionary";
import {
  fetchHomonymsFromSupabase,
  lookupKeywordsFromSupabase,
} from "@/lib/dream/dictionary-supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";

    if (!sentence) {
      return NextResponse.json(
        { error: "sentence 필드가 필요합니다. 꿈 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    let homonyms: Record<string, string[]> = {};
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        homonyms = await fetchHomonymsFromSupabase();
      } catch {
        // homonym 조회 실패 시 빈 객체 (sense 제한 없이 진행)
      }
    }

    const { keywords } = await extractKeywordsFromDream(sentence, {
      homonyms: Object.keys(homonyms).length > 0 ? homonyms : undefined,
    });

    if (keywords.length === 0) {
      return NextResponse.json({
        sentence,
        keywords: [],
        results: [],
        mergedNums: [],
        message: "추출된 키워드가 없습니다.",
      });
    }

    let results: { keyword: string; entry: { word: string; nums: number[]; star: number } | null; nums: number[] }[];
    let mergedNums: number[];

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const data = await lookupKeywordsFromSupabase(keywords);
        results = data.results;
        mergedNums = data.mergedNums;
      } catch {
        const dict = await loadDictionary();
        const data = lookupKeywords(dict, keywords);
        results = data.results;
        mergedNums = data.mergedNums;
      }
    } else {
      const dict = await loadDictionary();
      const data = lookupKeywords(dict, keywords);
      results = data.results;
      mergedNums = data.mergedNums;
    }

    return NextResponse.json({
      sentence,
      keywords,
      results,
      mergedNums,
    });
  } catch (err) {
    console.error("[dream/analyze] Error:", err);

    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status =
      message.includes("GEMINI_API_KEY") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
