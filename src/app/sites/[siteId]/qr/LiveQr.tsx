"use client";

import { useEffect, useState } from "react";
import type { QrPayload } from "@/lib/qr-token";

type QrState = { url: string; dataUrl: string; rotatesAt: number };

function toState(payload: QrPayload): QrState {
  return { url: payload.url, dataUrl: payload.dataUrl, rotatesAt: Date.now() + payload.msUntilRotation };
}

export default function LiveQr({ siteId, initialQr }: { siteId: string; initialQr: QrPayload }) {
  const [qr, setQr] = useState<QrState>(() => toState(initialQr));
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 切り替え時刻になったら（通信エラー時は10秒後に）最新のQRを取得
  useEffect(() => {
    const delay = error ? 10_000 : Math.max(qr.rotatesAt - Date.now(), 0) + 500;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/qr/${siteId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        setQr(toState(await res.json()));
        setNow(Date.now());
        setError(false);
      } catch {
        setError(true);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [qr, error, siteId]);

  const secondsLeft = Math.max(Math.ceil((qr.rotatesAt - now) / 1000), 0);

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr.dataUrl} alt="出退勤QRコード" className="mx-auto my-4" width={320} height={320} />
      <p className="text-sm text-slate-600">
        あと <span className="font-bold tabular-nums">{secondsLeft}</span> 秒で新しいQRコードに切り替わります
      </p>
      {error && <p className="mt-1 text-xs text-red-600">通信エラー：再接続を試みています</p>}
      <a
        href={qr.url}
        className="mt-4 inline-block rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
      >
        スマホを持っていない人：この端末で打刻する
      </a>
    </div>
  );
}
