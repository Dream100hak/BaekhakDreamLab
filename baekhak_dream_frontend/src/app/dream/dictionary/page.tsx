"use client";

/**
 * 꿈 해몽 사전 간단 테스트 페이지
 * 로컬 word.json 기반 조회 확인용
 */

import Link from "next/link";
import { useState } from "react";

interface LookupResult {
  keyword: string;
  entry: { nums: number[]; star: number; word: string } | null;
  nums: number[];
}

export default function DictionaryPage() {
  const [keywords, setKeywords] = useState("가게, 배, 모기");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    keywords: string[];
    results: LookupResult[];
    mergedNums: number[];
  } | null>(null);
  const [stats, setStats] = useState<{ chosungCount: number; keywordCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(
        `/api/dream/lookup?keywords=${encodeURIComponent(keywords)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleStats = async () => {
    setLoading(true);
    setError(null);
    setStats(null);
    try {
      const res = await fetch("/api/dream/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "통계 조회 실패");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "통계 조회 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            꿈 해몽 사전
          </h1>
          <Link
            href="/dream/list"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            사전식 목록
          </Link>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Supabase dream_keywords 조회 (실패 시 로컬 word.json fallback)
        </p>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            키워드 (쉼표 구분)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="가게, 배, 모기, 집"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleLookup}
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "조회 중..." : "사전 조회"}
            </button>
            <button
              type="button"
              onClick={handleStats}
              disabled={loading}
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              사전 통계
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {stats && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              사전 통계
            </h2>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              초성 그룹: {stats.chosungCount}개 / 총 키워드: {stats.keywordCount}개
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              조회 결과
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                병합 번호 (중복 제거):{" "}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {results.mergedNums.join(", ") || "(없음)"}
                </span>
              </p>
              <ul className="space-y-2">
                {results.results.map((r) => (
                  <li
                    key={r.keyword}
                    className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 dark:bg-zinc-700/50"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {r.keyword}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {r.entry
                        ? `번호: ${r.nums.join(", ")}`
                        : "(사전에 없음)"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
