/**
 * 꿈 해몽 사전 Supabase 조회 모듈
 * dream_keywords 테이블 기반
 */

import { createServerClient } from "@/lib/supabase/server";
import type { DreamLookupResult } from "@/types/dream";

/** 끝수(0~9) → 해당 로또 번호 배열 (1~45) */
const END_DIGIT_NUMS: Record<number, number[]> = {
  0: [10, 20, 30, 40],
  1: [1, 11, 21, 31, 41],
  2: [2, 12, 22, 32, 42],
  3: [3, 13, 23, 33, 43],
  4: [4, 14, 24, 34, 44],
  5: [5, 15, 25, 35, 45],
  6: [6, 16, 26, 36],
  7: [7, 17, 27, 37],
  8: [8, 18, 28, 38],
  9: [9, 19, 29, 39],
};

/** end_digits가 있으면 해당 끝수 번호들을 nums에 합산 */
const expandWithEndDigits = (
  nums: number[],
  endDigits: number[] | null
): number[] => {
  if (!endDigits || endDigits.length === 0) return nums;
  const extra = endDigits.flatMap((d) => END_DIGIT_NUMS[d] ?? []);
  return [...new Set([...nums, ...extra])].sort((a, b) => a - b);
};

/** 단일 키워드 조회 (정확히 일치: word 또는 word+sense) */
export const lookupKeywordFromSupabase = async (
  keyword: string
): Promise<DreamLookupResult> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { keyword: trimmed, entry: null, nums: [] };
  }

  const supabase = createServerClient();

  // 1) 정확 일치 시도: word = trimmed, sense = '' or parsed
  const match = trimmed.match(/^(.+?)\(([^)]+)\)$/);
  const baseWord = match ? match[1] : trimmed;
  const sense = match ? match[2] : "";

  const { data, error } = await supabase
    .from("dream_keywords")
    .select("word, sense, nums, star, end_digits")
    .eq("word", baseWord);

  if (error) {
    console.error("[dictionary-supabase] lookup error:", error);
    return { keyword: trimmed, entry: null, nums: [] };
  }

  type Row = { word: string; sense: string | null; nums: number[]; star: number; end_digits: number[] | null };
  const rows = (data ?? []) as Row[];

  const row = sense
    ? rows?.find((r) => (r.sense ?? "") === sense)
    : rows?.find((r) => !r.sense || r.sense === "");

  if (!row) {
    return { keyword: trimmed, entry: null, nums: [] };
  }

  const nums = expandWithEndDigits(row.nums ?? [], row.end_digits);

  return {
    keyword: trimmed,
    entry: {
      word: row.word + (row.sense ? `(${row.sense})` : ""),
      nums,
      star: row.star ?? 0,
    },
    nums,
  };
};

/** 여러 키워드 조회 */
export const lookupKeywordsFromSupabase = async (
  keywords: string[]
): Promise<{ results: DreamLookupResult[]; mergedNums: number[] }> => {
  const results = await Promise.all(
    keywords.map((kw) => lookupKeywordFromSupabase(kw))
  );
  const allNums = results.flatMap((r) => r.nums);
  const mergedNums = [...new Set(allNums)].sort((a, b) => a - b);
  return { results, mergedNums };
};
