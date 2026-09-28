"use client";

import { useState } from "react";
import PhotoCapture from "./PhotoCapture";

export default function IncidentForm({ token, staffId }: { token: string; staffId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, staffId, message, photoDataUrl: photo ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setResult({ text: "リーダー・本社に報告しました。", isError: false });
      setMessage("");
      setPhoto(null);
    } catch (err) {
      setResult({
        text: err instanceof Error ? err.message : "送信に失敗しました",
        isError: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-amber-300 bg-amber-50 py-2 text-sm font-medium text-amber-800"
      >
        トラブル・申し送りを報告する
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-left"
    >
      <p className="text-sm font-semibold text-amber-800">トラブル・申し送り報告</p>
      <textarea
        className="w-full rounded border px-2 py-1.5 text-sm"
        rows={3}
        placeholder="例：3階の窓ガラスにひびを発見、備品の洗剤が残り少ない、など"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <PhotoCapture label="写真を添付する（任意）" value={photo} onChange={setPhoto} />

      {result && (
        <p className={`text-sm ${result.isError ? "text-red-600" : "text-emerald-700"}`}>
          {result.text}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "送信中..." : "報告を送信"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:underline"
        >
          閉じる
        </button>
      </div>
    </form>
  );
}
