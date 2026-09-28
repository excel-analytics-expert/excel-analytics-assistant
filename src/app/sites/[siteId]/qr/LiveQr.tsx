"use client";

import { useEffect, useState } from "react";
import type { QrPayload } from "@/lib/qr-token";

type QrState = { url: string; dataUrl: string; rotatesAt: number; reachableFromPhone: boolean };

function toState(payload: QrPayload): QrState {
  return {
    url: payload.url,
    dataUrl: payload.dataUrl,
    rotatesAt: Date.now() + payload.msUntilRotation,
    reachableFromPhone: payload.reachableFromPhone,
  };
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

  // 表示用端末の画面が自動で消えないようにする（iOS Safari 16.4以降・Android Chrome、HTTPS接続時のみ有効）。
  // タブを切り替えると解除されるため、戻ってきたら取り直す。
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) lock.release();
        else sentinel = lock;
      } catch {
        // 省電力モード等で拒否された場合は何もしない
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release();
    };
  }, []);

  const secondsLeft = Math.max(Math.ceil((qr.rotatesAt - now) / 1000), 0);

  return (
    <div>
      {!qr.reachableFromPhone && (
        <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-left text-xs text-red-700">
          このQRコードは「localhost」宛てになっているため、スマホで読み取っても開けません。
          PCのIPアドレス（例: http://192.168.1.10:3000）でこの画面を開き直すか、
          公開URLを環境変数 APP_BASE_URL に設定してください。
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr.dataUrl}
        alt="出退勤QRコード"
        className="mx-auto my-4 aspect-square w-full max-w-[340px] bg-white"
      />
      <p className="text-sm text-slate-600">
        あと <span className="font-bold tabular-nums">{secondsLeft}</span> 秒で新しいQRコードに切り替わります
      </p>
      {error && <p className="mt-1 text-xs text-red-600">通信エラー：再接続を試みています</p>}
      <a
        href={qr.url}
        className="mt-4 inline-block rounded bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
      >
        スマホを持っていない人：この端末で打刻する
      </a>
    </div>
  );
}
