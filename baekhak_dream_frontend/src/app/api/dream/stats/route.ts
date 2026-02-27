/**
 * 꿈 해몽 사전 통계 API
 * GET /api/dream/stats
 * source=supabase | local (기본: supabase)
 */

import { NextRequest, NextResponse } from "next/server";
import { loadDictionary, getDictionaryStats } from "@/lib/dream/dictionary";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const source = req.nextUrl.searchParams.get("source") ?? "supabase";

    if (source === "supabase" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createServerClient();
        const { count, error } = await supabase
          .from("dream_keywords")
          .select("*", { count: "exact", head: true });

        if (error) throw error;

        return NextResponse.json({
          chosungCount: 0,
          keywordCount: count ?? 0,
          source: "supabase",
          message: "Supabase dream_keywords 테이블",
        });
      } catch {
        // fallback to local
      }
    }

    const dict = await loadDictionary();
    const stats = getDictionaryStats(dict);

    return NextResponse.json({
      ...stats,
      source: "local",
      message: "로컬 word.json 기반 사전",
    });
  } catch (err) {
    console.error("[dream/stats] Error:", err);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
