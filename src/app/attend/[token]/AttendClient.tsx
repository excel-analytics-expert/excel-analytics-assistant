"use client";

import { useState } from "react";

type StaffStatus = {
  staffId: string;
  name: string;
  role: string;
  clockIn: string | null; // ISO string
  clockOut: string | null;
};

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default function AttendClient({
  token,
  siteName,
  staffList,
}: {
  token: string;
  siteName: string;
  staffList: StaffStatus[];
}) {
  const [selected, setSelected] = useState<StaffStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleClock(action: "IN" | "OUT") {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, staffId: selected.staffId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "打刻に失敗しました");
        return;
      }
      setMessage(data.message);
      const attendance = data.attendance;
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              clockIn: attendance?.clockIn ?? prev.clockIn,
              clockOut: attendance?.clockOut ?? prev.clockOut,
            }
          : prev
      );
    } catch {
      setIsError(true);
      setMessage("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-center">{siteName}</h1>
        <p className="text-center text-sm text-slate-500">ご自身の名前をタップしてください</p>
        <div className="grid gap-3">
          {staffList.map((s) => (
            <button
              key={s.staffId}
              onClick={() => setSelected(s)}
              className="rounded-lg border bg-white py-4 text-lg font-medium shadow-sm active:bg-slate-100"
            >
              {s.name}
              {s.role === "LEADER" && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  リーダー
                </span>
              )}
            </button>
          ))}
        </div>
        {staffList.length === 0 && (
          <p className="text-center text-red-500 text-sm">
            本日この現場に割り当てられているスタッフがいません。管理者に確認してください。
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">{siteName}</h1>
      <div className="rounded-lg border bg-white p-6 text-center shadow-sm space-y-4">
        <p className="text-2xl font-bold">{selected.name}</p>
        <p className="text-sm text-slate-500">
          出勤: {formatTime(selected.clockIn) ?? "未打刻"} / 退勤:{" "}
          {formatTime(selected.clockOut) ?? "未打刻"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClock("IN")}
            disabled={busy}
            className="rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            出勤
          </button>
          <button
            onClick={() => handleClock("OUT")}
            disabled={busy}
            className="rounded-lg bg-slate-700 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            退勤
          </button>
        </div>

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-emerald-700"}`}>{message}</p>
        )}

        <button onClick={() => setSelected(null)} className="text-sm text-sky-600 hover:underline">
          別の人が打刻する
        </button>
      </div>
    </div>
  );
}
