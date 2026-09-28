"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffRole } from "@/lib/constants";

type Site = {
  id: string;
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
};

type Staff = {
  id: string;
  name: string;
  role: string;
  active: boolean;
};

export default function ShiftForm({ sites, staff }: { sites: Site[]; staff: Staff[] }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState(sites[0]?.defaultStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(sites[0]?.defaultEndTime ?? "17:00");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSiteChange(id: string) {
    setSiteId(id);
    const site = sites.find((s) => s.id === id);
    if (site) {
      setStartTime(site.defaultStartTime);
      setEndTime(site.defaultEndTime);
    }
  }

  function toggleStaff(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId || !date) {
      setError("現場と日付を選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, date, startTime, endTime, staffIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "作成に失敗しました");
      }
      setDate("");
      setStaffIds([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <h2 className="font-semibold">シフトを新規作成</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          現場
          <select
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={siteId}
            onChange={(e) => handleSiteChange(e.target.value)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          日付
          <input
            type="date"
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="text-sm">
          開始時刻
          <input
            type="time"
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>

        <label className="text-sm">
          終了時刻
          <input
            type="time"
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </div>

      <div>
        <p className="text-sm mb-1">担当スタッフ</p>
        <div className="flex flex-wrap gap-2">
          {staff.map((s) => (
            <label
              key={s.id}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                staffIds.includes(s.id)
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={staffIds.includes(s.id)}
                onChange={() => toggleStaff(s.id)}
              />
              {s.name}
              {s.role === StaffRole.LEADER && " (リーダー)"}
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
        {submitting ? "作成中..." : "シフトを作成"}
      </button>
    </form>
  );
}
