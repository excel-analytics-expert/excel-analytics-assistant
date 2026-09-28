"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SiteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [requiredHeadcount, setRequiredHeadcount] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("現場名を入力してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          requiredHeadcount,
          defaultStartTime: startTime,
          defaultEndTime: endTime,
        }),
      });
      if (!res.ok) throw new Error("追加に失敗しました");
      setName("");
      setAddress("");
      setRequiredHeadcount(1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h2 className="font-semibold">現場を追加</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          現場名
          <input
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          住所
          <input
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <label className="text-sm">
          必要人数
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={requiredHeadcount}
            onChange={(e) => setRequiredHeadcount(Number(e.target.value))}
          />
        </label>
        <div className="flex gap-2">
          <label className="text-sm flex-1">
            標準開始
            <input
              type="time"
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="text-sm flex-1">
            標準終了
            <input
              type="time"
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        追加
      </button>
    </form>
  );
}
