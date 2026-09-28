"use client";

import { useState } from "react";
import PhotoCapture from "./PhotoCapture";

type Kind = "TROUBLE" | "LATE";

const CONFIG: Record<
  Kind,
  {
    openLabel: string;
    title: string;
    placeholder: string;
    photoLabel: string;
    photoFacing: "user" | "environment";
    submitLabel: string;
    buttonClass: string;
    formClass: string;
    titleClass: string;
    submitClass: string;
  }
> = {
  LATE: {
    openLabel: "遅刻・遅延の届出（理由・遅延証明書）",
    title: "遅刻・遅延の届出",
    placeholder: "遅刻した理由を書いてください。例：〇〇線が人身事故で遅延した／体調不良で病院に寄った",
    photoLabel: "遅延証明書などの写真を添付（任意）",
    photoFacing: "environment",
    submitLabel: "届出を提出",
    buttonClass: "border-sky-300 bg-sky-50 text-sky-900",
    formClass: "border-sky-300 bg-sky-50",
    titleClass: "text-sky-900",
    submitClass: "bg-sky-700",
  },
  TROUBLE: {
    openLabel: "トラブル・申し送りを報告する",
    title: "トラブル・申し送り報告",
    placeholder: "例：3階の窓ガラスにひびを発見、備品の洗剤が残り少ない、など",
    photoLabel: "写真を添付する（任意）",
    photoFacing: "environment",
    submitLabel: "報告を送信",
    buttonClass: "border-amber-300 bg-amber-50 text-amber-800",
    formClass: "border-amber-300 bg-amber-50",
    titleClass: "text-amber-800",
    submitClass: "bg-amber-700",
  },
};

export default function IncidentForm({
  token,
  staffId,
  kind,
  initialOpen = false,
}: {
  token: string;
  staffId: string;
  kind: Kind;
  initialOpen?: boolean;
}) {
  const c = CONFIG[kind];
  const [open, setOpen] = useState(initialOpen);
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
        body: JSON.stringify({ token, staffId, kind, message, photoDataUrl: photo ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setResult({ text: data.message, isError: false });
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
      <div>
        <button
          onClick={() => setOpen(true)}
          className={`w-full rounded-lg border py-3 text-sm font-medium ${c.buttonClass}`}
        >
          {c.openLabel}
        </button>
        {result && !result.isError && <p className="mt-1 text-sm text-emerald-700">✓ {result.text}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 rounded-lg border p-4 text-left ${c.formClass}`}>
      <p className={`text-sm font-semibold ${c.titleClass}`}>{c.title}</p>
      <textarea
        className="w-full rounded border px-2 py-1.5 text-sm"
        rows={4}
        placeholder={c.placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <PhotoCapture label={c.photoLabel} value={photo} onChange={setPhoto} facing={c.photoFacing} />

      {result && (
        <p className={`text-sm ${result.isError ? "text-red-600" : "text-emerald-700"}`}>
          {result.isError ? "" : "✓ "}
          {result.text}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className={`rounded px-4 py-3 text-sm font-medium text-white disabled:opacity-50 ${c.submitClass}`}
        >
          {submitting ? "送信中..." : c.submitLabel}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-2 py-3 text-sm text-slate-500 hover:underline"
        >
          閉じる
        </button>
      </div>
    </form>
  );
}
