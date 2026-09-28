"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Site = { id: string; name: string; requiredHeadcount: number };

type Result = {
  createdShifts: number;
  skippedExistingShifts: number;
  totalAssignments: number;
  shortfalls: { date: string; siteName: string; needed: number; assigned: number }[];
};

export default function GenerateForm({
  sites,
  defaultStart,
  defaultEnd,
}: {
  sites: Site[];
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [siteIds, setSiteIds] = useState<string[]>(sites.map((s) => s.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function toggleSite(id: string) {
    setSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (siteIds.length === 0) {
      setError("現場を1つ以上選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/shifts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, siteIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "作成に失敗しました");
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            開始日
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="text-sm">
            終了日
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <div>
          <p className="text-sm mb-1">対象現場（必要人数）</p>
          <div className="flex flex-wrap gap-2">
            {sites.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  siteIds.includes(s.id)
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={siteIds.includes(s.id)}
                  onChange={() => toggleSite(s.id)}
                />
                {s.name}（必要{s.requiredHeadcount}人）
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "作成中..." : "自動でシフトを作成"}
        </button>
        <p className="text-xs text-slate-500">
          既存のシフトがある日・現場はスキップされます。割り当ては人数のバランスを見て自動で行われ、各現場になるべくリーダーが1名含まれるようにします。
        </p>
      </form>

      {result && (
        <div className="rounded-lg border bg-white p-4 shadow-sm text-sm space-y-2">
          <p>
            作成したシフト: <b>{result.createdShifts}</b> 件（既存のためスキップ:{" "}
            {result.skippedExistingShifts} 件）
          </p>
          <p>
            割り当てたスタッフ延べ人数: <b>{result.totalAssignments}</b> 人
          </p>
          {result.shortfalls.length > 0 ? (
            <div className="text-amber-700">
              <p className="font-medium">人員が不足している枠があります：</p>
              <ul className="list-disc pl-5">
                {result.shortfalls.map((s, i) => (
                  <li key={i}>
                    {s.date} {s.siteName}: 必要{s.needed}人 → 割当{s.assigned}人
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-emerald-700">全ての枠が必要人数を満たしました。</p>
          )}
        </div>
      )}
    </div>
  );
}
