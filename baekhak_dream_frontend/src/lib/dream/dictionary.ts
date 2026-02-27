/**
 * 꿈 해몽 사전 로컬 조회 모듈
 * public/data/word.json 기반 - Supabase 마이그레이션 전 로컬 테스트용
 */

import { readFileSync } from "fs";
import { join } from "path";

import type { DreamDictionary, DreamKeywordEntry, DreamLookupResult } from "@/types/dream";

/** word.json 경로 (public/data/word.json) */
const WORD_JSON_PATH = join(process.cwd(), "public", "data", "word.json");

/** 한글 초성 추출 (초성 인덱스용) */
const CHOSUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** 주어진 글자의 초성 추출 */
export const getChosung = (char: string): string => {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return char;
  return CHOSUNG[Math.floor(code / 588)];
};

/** 단어의 첫 글자 초성 (사전 인덱싱용) */
export const getWordChosung = (word: string): string => {
  if (!word || word.length === 0) return "";
  return getChosung(word[0]);
};

/** 전역 사전 캐시 (최초 로드 시 한 번만 읽기) */
let dictionaryCache: DreamDictionary | null = null;

/** word.json 로드 (서버 전용 - fs 사용) */
export const loadDictionary = async (): Promise<DreamDictionary> => {
  if (dictionaryCache) return dictionaryCache;
  try {
    const raw = readFileSync(WORD_JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as DreamDictionary;
    dictionaryCache = data;
    return data;
  } catch (err) {
    throw new Error(
      "word.json을 찾을 수 없습니다. public/data/word.json에 파일을 넣어주세요. " +
        "자세한 내용은 public/data/README.md를 참고하세요."
    );
  }
};

/** 단일 키워드 조회 */
export const lookupKeyword = (
  dict: DreamDictionary,
  keyword: string
): DreamLookupResult => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { keyword: trimmed, entry: null, nums: [] };
  }

  const chosung = getWordChosung(trimmed);
  const group = dict[chosung];
  const entry: DreamKeywordEntry | undefined = group?.[trimmed];

  return {
    keyword: trimmed,
    entry: entry ?? null,
    nums: entry?.nums ?? [],
  };
};

/** 여러 키워드 조회 (중복 번호 병합) */
export const lookupKeywords = (
  dict: DreamDictionary,
  keywords: string[]
): { results: DreamLookupResult[]; mergedNums: number[] } => {
  const results = keywords.map((kw) => lookupKeyword(dict, kw));
  const allNums = results.flatMap((r) => r.nums);
  const mergedNums = [...new Set(allNums)].sort((a, b) => a - b);
  return { results, mergedNums };
};

/** 사전에 포함된 전체 키워드 수 (대략) */
export const getDictionaryStats = (dict: DreamDictionary): { chosungCount: number; keywordCount: number } => {
  let keywordCount = 0;
  for (const group of Object.values(dict)) {
    keywordCount += Object.keys(group).length;
  }
  return {
    chosungCount: Object.keys(dict).length,
    keywordCount,
  };
};
