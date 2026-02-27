/**
 * 꿈 해몽 사전 조회 API
 * GET /api/dream/lookup?keywords=가게,배,모기
 * source=supabase | local (기본: supabase, 실패 시 local fallback)
 */

import { NextRequest, NextResponse } from "next/server";

import { loadDictionary, lookupKeywords } from "@/lib/dream/dictionary";
import { lookupKeywordsFromSupabase } from "@/lib/dream/dictionary-supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const keywordsParam = searchParams.get("keywords");
    const source = searchParams.get("source") ?? "supabase";

    if (!keywordsParam || keywordsParam.trim() === "") {
      return NextResponse.json(
        { error: "keywords 쿼리 파라미터가 필요합니다. 예: ?keywords=가게,배,모기" },
        { status: 400 }
      );
    }

    const keywords = keywordsParam
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    let results: { keyword: string; entry: { word: string; nums: number[]; star: number } | null; nums: number[] }[];
    let mergedNums: number[];

    if (source === "supabase" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
      keywords,
      results,
      mergedNums,
    });
  } catch (err) {
    console.error("[dream/lookup] Error:", err);
    return NextResponse.json(
      { error: "사전 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
