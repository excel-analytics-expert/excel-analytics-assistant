"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton({ generatedAt }: { generatedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>最終更新 {generatedAt}</span>
      <button
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-50"
      >
        {pending ? "更新中…" : "↻ 更新"}
      </button>
    </div>
  );
}
