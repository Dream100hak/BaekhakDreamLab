"use client";

/**
 * 꿈 문장 분석 페이지
 * 자연어 꿈 입력 → Gemini 키워드 추출 → 해몽 조회
 */

import Link from "next/link";
import { useState } from "react";

interface LookupResult {
  keyword: string;
  entry: { nums: number[]; star: number; word: string } | null;
  nums: number[];
}

interface AnalyzeResponse {
  sentence: string;
  keywords: string[];
  results: LookupResult[];
  mergedNums: number[];
  message?: string;
}

export default function AnalyzePage() {
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/dream/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "분석 실패");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            꿈 문장 분석
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← 홈
          </Link>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          꿈 내용을 자연스럽게 입력하시면 AI가 키워드를 추출해 해몽 결과를 보여드립니다.
        </p>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            꿈 내용
          </label>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="예: 어제 꿈에 바다에서 큰 배가 침몰했고, 고양이가 나를 구해줬어."
            rows={4}
            className="mt-1 w-full resize-none rounded border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !sentence.trim()}
            className="mt-3 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "분석 중..." : "분석하기"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              분석 결과
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                추출된 키워드:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {data.keywords.join(", ") || "(없음)"}
                </span>
              </p>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                추천 로또 번호 (중복 제거):{" "}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {data.mergedNums.length ? data.mergedNums.join(", ") : "(없음)"}
                </span>
              </p>
              <ul className="space-y-2">
                {data.results.map((r) => (
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
              {data.message && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {data.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
