/**
 * word.json → Supabase dream_keywords 시드 API
 * POST /api/dream/seed
 * word.json 전체(약 4905건)를 빠짐없이 upsert
 */

import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { DreamDictionary, DreamKeywordEntry } from "@/types/dream";

type DreamKeywordInsert = Database["public"]["Tables"]["dream_keywords"]["Insert"];

const WORD_JSON_PATH = join(process.cwd(), "public", "data", "word.json");

/** 타임아웃 연장 (Vercel 등에서 긴 시드 허용) */
export const maxDuration = 60;

/** "배(과일)" → { word: "배", sense: "과일" } */
const parseWordAndSense = (rawWord: string): { word: string; sense: string | null } => {
  const match = rawWord.match(/^(.+?)\(([^)]+)\)$/);
  if (match) {
    return { word: match[1], sense: match[2] };
  }
  return { word: rawWord, sense: null };
};

/**
 * nums 배열에서 end_digits 추출
 * 0끝수: 10,20,30,40 / 1끝수: 1,11,21,31,41 / 2끝수: 2,12,22,32,42 ... (로또 1~45)
 * 해당 끝수 전체가 nums에 다 있으면 end_digits에 포함
 */
const getEndDigitsFromNums = (nums: number[]): number[] => {
  if (!nums?.length) return [];
  const numSet = new Set(nums);
  const result: number[] = [];

  for (let d = 0; d <= 9; d++) {
    const endDigitNums: number[] = [];
    for (let n = d === 0 ? 10 : d; n <= 45; n += 10) {
      if (n >= 1 && n <= 45) endDigitNums.push(n);
    }
    const allPresent = endDigitNums.length > 0 && endDigitNums.every((n) => numSet.has(n));
    if (allPresent) result.push(d);
  }
  return result;
};

/** word.json 플랫하게 변환하여 DB Insert 형식으로 */
const flattenToRows = (dict: DreamDictionary) => {
  const rows: Array<{
    word: string;
    sense: string;
    nums: number[];
    star: number;
    end_digits: number[];
  }> = [];

  for (const group of Object.values(dict)) {
    for (const [, entry] of Object.entries(group) as [string, DreamKeywordEntry][]) {
      const { word, sense } = parseWordAndSense(entry.word);
      const nums = Array.isArray(entry.nums) ? entry.nums : [];
      const endDigits = getEndDigitsFromNums(nums);

      rows.push({
        word,
        sense: sense ?? "",
        nums,
        star: entry.star ?? 0,
        end_digits: endDigits.length > 0 ? endDigits : [],
      });
    }
  }
  return rows;
};

export async function POST() {
  try {
    const raw = readFileSync(WORD_JSON_PATH, "utf-8");
    const dict = JSON.parse(raw) as DreamDictionary;
    const rows = flattenToRows(dict);

    const supabase = createServerClient();

    // 배치 INSERT (작은 배치로 타임아웃/페이로드 오류 방지)
    const BATCH = 250;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const payload: DreamKeywordInsert[] = chunk.map((r) => ({
        word: r.word,
        sense: r.sense || "",
        nums: Array.isArray(r.nums) ? r.nums : [],
        star: r.star,
        end_digits: r.end_digits.length > 0 ? r.end_digits : null,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("dream_keywords").upsert(payload as any, {
        onConflict: "word,sense",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error("[dream/seed] Upsert error:", error);
        return NextResponse.json(
          {
            error: `시드 실패 (${inserted}건까지 완료): ${error.message}`,
            inserted,
            total: rows.length,
            failedBatch: Math.floor(i / BATCH) + 1,
          },
          { status: 500 }
        );
      }
      inserted += chunk.length;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      inserted,
      message: `dream_keywords 시드 완료 (${inserted}건)`,
    });
  } catch (err) {
    console.error("[dream/seed] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "시드 중 오류 발생",
      },
      { status: 500 }
    );
  }
}
