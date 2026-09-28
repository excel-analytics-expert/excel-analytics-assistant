"use client";

import { useState } from "react";
import PhotoCapture from "./PhotoCapture";
import IncidentForm from "./IncidentForm";

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
  const [photo, setPhoto] = useState<string | null>(null);
  const [skipPhoto, setSkipPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function selectStaff(s: StaffStatus) {
    setSelected(s);
    setPhoto(null);
    setSkipPhoto(false);
    setMessage(null);
    setIsError(false);
  }

  async function handleClock(action: "IN" | "OUT") {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          staffId: selected.staffId,
          action,
          photoDataUrl: photo ?? undefined,
        }),
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
      setPhoto(null);
      setSkipPhoto(false);
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
        <p className="text-center text-xs text-slate-400">
          スマートフォンをお持ちでない方は、リーダーの端末でこの画面を開き、順番に操作してください。
        </p>
        <div className="grid gap-3">
          {staffList.map((s) => (
            <button
              key={s.staffId}
              onClick={() => selectStaff(s)}
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

  const canClock = Boolean(photo) || skipPhoto;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-center">{siteName}</h1>
      <div className="rounded-lg border bg-white p-6 text-center shadow-sm space-y-4">
        <p className="text-2xl font-bold">{selected.name}</p>
        <p className="text-sm text-slate-500">
          出勤: {formatTime(selected.clockIn) ?? "未打刻"} / 退勤:{" "}
          {formatTime(selected.clockOut) ?? "未打刻"}
        </p>

        <div className="text-left">
          <p className="mb-1 text-sm font-medium text-slate-700">本人確認用の写真</p>
          <PhotoCapture label="写真を撮影する" value={photo} onChange={setPhoto} />
          {!photo && (
            <button
              type="button"
              onClick={() => setSkipPhoto(true)}
              className="mt-1 text-xs text-slate-400 hover:underline"
            >
              カメラが使えない場合はこちら（写真なしで打刻）
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClock("IN")}
            disabled={busy || !canClock}
            className="rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            出勤
          </button>
          <button
            onClick={() => handleClock("OUT")}
            disabled={busy || !canClock}
            className="rounded-lg bg-slate-700 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            退勤
          </button>
        </div>
        {!canClock && (
          <p className="text-xs text-slate-400">写真を撮影すると打刻ボタンが押せます。</p>
        )}

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-emerald-700"}`}>{message}</p>
        )}

        <IncidentForm token={token} staffId={selected.staffId} />

        <button onClick={() => setSelected(null)} className="text-sm text-sky-600 hover:underline">
          別の人が打刻する
        </button>
      </div>
    </div>
  );
}
