"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

// iPhoneの高解像度写真(12MP超)でもメモリを圧迫しないよう、Base64化せずObjectURLで読み込んで縮小する。
// 撮影時の向き(EXIF)は iOS Safari 13.4+ / Android Chrome 81+ で自動補正される。
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("decode"));
    };
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { naturalWidth: width, naturalHeight: height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.src = objectUrl;
  });
}

export default function PhotoCapture({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      onChange(await resizeToDataUrl(file));
    } catch {
      onChange(null);
      // AndroidでHEIC形式（一部のGalaxy等の既定）の写真はブラウザで開けない
      setError(
        "この写真は読み込めませんでした。もう一度撮影してください。続く場合はカメラの設定で保存形式を「JPEG」にしてください。"
      );
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="撮影した本人確認用写真"
            className="h-16 w-16 rounded-full object-cover border"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-2 py-2 text-sm text-sky-600 hover:underline"
          >
            撮り直す
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-slate-300 py-4 text-sm text-slate-600 active:bg-slate-50"
        >
          📷 {label}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
