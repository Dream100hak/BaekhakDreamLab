"use client";

/**
 * 꿈 해몽 사전 - 사전식 키워드 목록
 * Supabase dream_keywords를 초성별로 표시하여 누락 확인
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CHOSUNG_ORDER = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

interface Keyword {
  word: string;
  sense: string;
  nums: number[];
  star: number;
  inDb: boolean;
}

interface ListData {
  byChosung: Record<string, Keyword[]>;
  total: number;
  inDbCount: number;
}

export default function DreamListPage() {
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editSense, setEditSense] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/dream/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "시드 실패");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "시드 중 오류");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dream/list");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "목록 조회 실패");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchList();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToChosung = (c: string) => {
    sectionRefs.current[c]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChosungClick = (c: string) => {
    const nextFilter = filter === c ? "" : c;
    setFilter(nextFilter);
    if (nextFilter) {
      setTimeout(() => sectionRefs.current[nextFilter]?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const openEditModal = (k: Keyword) => {
    setEditing(k);
    setEditWord(k.word);
    setEditSense(k.sense);
  };

  const closeEditModal = () => {
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dream/keyword", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: editing.word,
          sense: editing.sense,
          newWord: editWord.trim(),
          newSense: editSense.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "수정 실패");
      closeEditModal();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 중 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || !confirm(`"${editing.sense ? `${editing.word}(${editing.sense})` : editing.word}" 를(을) DB에서 삭제할까요?`))
      return;
    setDeleting(true);
    try {
      const res = await fetch("/api/dream/keyword", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: editing.word, sense: editing.sense }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "삭제 실패");
      closeEditModal();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류");
    } finally {
      setDeleting(false);
    }
  };

  const filteredByChosung: Record<string, Keyword[]> = {};
  if (data) {
    const q = filter.trim();
    const isChosungFilter = q.length === 1 && CHOSUNG_ORDER.includes(q);

    for (const c of CHOSUNG_ORDER) {
      const list = data.byChosung[c] ?? [];
      let filtered = list;

      if (isChosungFilter) {
        if (c !== q) continue;
      } else if (q) {
        filtered = list.filter(
          (k) =>
            k.word.includes(q) ||
            (k.sense && k.sense.includes(q))
        );
      }
      if (filtered.length) filteredByChosung[c] = filtered;
    }
  }

  const displayTotal = Object.values(filteredByChosung).reduce(
    (s, arr) => s + arr.length,
    0
  );
  const missingCount = data ? Math.max(0, data.total - data.inDbCount) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              꿈 해몽 사전 (사전식)
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {seeding ? "시드 중..." : "시드 실행"}
              </button>
              <Link
                href="/dream/dictionary"
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                조회 테스트
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              총 {data?.total.toLocaleString() ?? "-"}건 (DB {data?.inDbCount.toLocaleString() ?? "-"}건)
              {missingCount > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  · 누락 {missingCount}건
                </span>
              )}
            </span>
            <input
              type="search"
              placeholder="자음 또는 단어 검색..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="flex flex-wrap gap-1">
              {CHOSUNG_ORDER.split("").map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChosungClick(c)}
                  className={`rounded px-2 py-0.5 text-sm font-medium ${
                    filter === c
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {loading && (
          <div className="py-12 text-center text-zinc-500">로딩 중...</div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {data && !loading && (
          <>
            {filter && (
              <p className="mb-4 text-sm text-zinc-500">
                &quot;{filter}&quot; 검색 결과: {displayTotal}건
              </p>
            )}
            <div className="space-y-8">
              {CHOSUNG_ORDER.split("").map((c) => {
                const list = filteredByChosung[c];
                if (!list?.length) return null;
                const label = c === " " ? "(기타)" : c;
                return (
                  <section
                    key={c}
                    ref={(el) => {
                      sectionRefs.current[c] = el;
                    }}
                    className="scroll-mt-24"
                  >
                    <h2 className="mb-3 flex items-center gap-2 border-b border-zinc-200 pb-2 text-lg font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        {label}
                      </span>
                      {list.length}건
                    </h2>
                    <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((k) => {
                        const display =
                          k.sense ? `${k.word}(${k.sense})` : k.word;
                        return (
                          <li
                            key={`${k.word}-${k.sense}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => k.inDb && openEditModal(k)}
                            onKeyDown={(e) =>
                              k.inDb &&
                              (e.key === "Enter" || e.key === " ") &&
                              openEditModal(k)
                            }
                            className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                              !k.inDb
                                ? "cursor-not-allowed border-amber-200 bg-amber-50/80 opacity-75 dark:border-amber-800/50 dark:bg-amber-900/20"
                                : k.sense
                                  ? "border-blue-200 bg-blue-50/80 hover:bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {display}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {k.nums.length ? k.nums.join(", ") : "-"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeEditModal()}
        >
          <div
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-modal-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              키워드 수정
            </h2>
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              DB(Supabase)에 있는 항목만 수정됩니다. word.json은 변경되지 않습니다.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  word
                </label>
                <input
                  type="text"
                  value={editWord}
                  onChange={(e) => setEditWord(e.target.value)}
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  sense (동음이의어 구분)
                </label>
                <input
                  type="text"
                  value={editSense}
                  onChange={(e) => setEditSense(e.target.value)}
                  placeholder="예: 사람, 날씨, 탈것"
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="rounded border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving || deleting}
                  className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
