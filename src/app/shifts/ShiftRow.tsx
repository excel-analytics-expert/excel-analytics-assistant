"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateJP } from "@/lib/date";
import { StaffRole } from "@/lib/constants";

type Staff = { id: string; name: string; role: string };

type ShiftData = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  site: { id: string; name: string };
  assignments: { staffId: string; staff: Staff }[];
};

export default function ShiftRow({ shift, allStaff }: { shift: ShiftData; allStaff: Staff[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [staffIds, setStaffIds] = useState(shift.assignments.map((a) => a.staffId));
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [busy, setBusy] = useState(false);

  function toggleStaff(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave() {
    setBusy(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime, staffIds }),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("このシフトを削除しますか？")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <tr className="border-t bg-sky-50">
        <td className="px-3 py-2">{formatDateJP(shift.date)}</td>
        <td className="px-3 py-2">{shift.site.name}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-24 rounded border px-1 py-0.5"
            />
            〜
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-24 rounded border px-1 py-0.5"
            />
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {allStaff.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer rounded-full border px-2 py-0.5 text-xs ${
                  staffIds.includes(s.id)
                    ? "border-sky-500 bg-sky-100 text-sky-700"
                    : "border-slate-300 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={staffIds.includes(s.id)}
                  onChange={() => toggleStaff(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <button
            onClick={handleSave}
            disabled={busy}
            className="mr-2 rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            保存
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-500">
            キャンセル
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="px-3 py-2 whitespace-nowrap">{formatDateJP(shift.date)}</td>
      <td className="px-3 py-2 whitespace-nowrap">{shift.site.name}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        {shift.startTime}〜{shift.endTime}
      </td>
      <td className="px-3 py-2">
        {shift.assignments.length === 0 ? (
          <span className="text-red-500 text-xs">未割当</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {shift.assignments.map((a) => (
              <span key={a.staffId} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {a.staff.name}
                {a.staff.role === StaffRole.LEADER && "★"}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <button onClick={() => setEditing(true)} className="mr-3 text-xs text-sky-600 hover:underline">
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          削除
        </button>
      </td>
    </tr>
  );
}
