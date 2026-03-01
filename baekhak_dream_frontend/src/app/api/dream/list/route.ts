/**
 * dream_keywords 사전식 목록 API
 * GET /api/dream/list
 * word.json 전체를 초성별로 반환 + Supabase와 비교하여 inDb 플래그 부여
 */

import { NextResponse } from "next/server";

import { getWordChosung, loadDictionary } from "@/lib/dream/dictionary";
import { createServerClient } from "@/lib/supabase/server";
import type { DreamDictionary, DreamKeywordEntry } from "@/types/dream";

/** 사전식 초성 순서 */
const CHOSUNG_ORDER = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** "배(과일)" → { word: "배", sense: "과일" } */
const parseWordAndSense = (rawWord: string): { word: string; sense: string | null } => {
  const match = rawWord.match(/^(.+?)\(([^)]+)\)$/);
  if (match) return { word: match[1], sense: match[2] };
  return { word: rawWord, sense: null };
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dict, supabase] = await Promise.all([loadDictionary(), (async () => createServerClient())()]);

    // Supabase에서 전부 가져와 "word|sense" Set 구성
    const PAGE = 1000;
    const inDbSet = new Set<string>();
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from("dream_keywords")
        .select("word, sense")
        .range(offset, offset + PAGE - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!chunk?.length) break;
      for (const r of chunk as { word: string; sense: string | null }[]) {
        inDbSet.add(`${r.word}|${r.sense ?? ""}`);
      }
      hasMore = chunk.length === PAGE;
      offset += PAGE;
    }

    // word.json 플랫하게 변환 + inDb 여부
    type Row = { word: string; sense: string; nums: number[]; star: number; inDb: boolean };
    const byChosung: Record<string, Row[]> = {};
    for (const c of CHOSUNG_ORDER) {
      byChosung[c] = [];
    }

    let total = 0;
    for (const group of Object.values(dict as DreamDictionary)) {
      for (const [, entry] of Object.entries(group) as [string, DreamKeywordEntry][]) {
        const { word, sense } = parseWordAndSense(entry.word);
        const senseStr = sense ?? "";
        const key = `${word}|${senseStr}`;
        const inDb = inDbSet.has(key);

        const chosung = getWordChosung(word);
        if (!byChosung[chosung]) byChosung[chosung] = [];
        byChosung[chosung].push({
          word,
          sense: senseStr,
          nums: Array.isArray(entry.nums) ? entry.nums : [],
          star: entry.star ?? 0,
          inDb,
        });
        total++;
      }
    }

    return NextResponse.json({
      byChosung,
      total,
      inDbCount: inDbSet.size,
    });
  } catch (err) {
    console.error("[dream/list] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "목록 조회 실패" },
      { status: 500 }
    );
  }
}
