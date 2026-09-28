"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
    >
      印刷する
    </button>
  );
}
