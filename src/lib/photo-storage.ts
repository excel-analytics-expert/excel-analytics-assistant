import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// 公開ディレクトリ(public/)の外に保存し、認証なしの直接アクセスや一覧化を避ける。
// 配信は /api/attendance/photo/[filename] 経由のみ。
const STORAGE_DIR = path.join(process.cwd(), "storage", "attendance-photos");

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,([a-zA-Z0-9+/=]+)$/;

export class InvalidPhotoError extends Error {}

/**
 * "data:image/jpeg;base64,..." 形式の画像をローカルディスクに保存し、ファイル名を返す。
 * ファイル名のみをDBに保持し、パストラバーサルを避けるため自前でUUIDを採番する。
 */
export async function savePhotoDataUrl(dataUrl: string): Promise<string> {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new InvalidPhotoError("対応していない画像形式です。");
  }

  const [, rawExt, base64] = match;
  const ext = rawExt === "jpg" ? "jpeg" : rawExt;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new InvalidPhotoError("画像サイズが不正です。");
  }

  await mkdir(STORAGE_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(STORAGE_DIR, filename), buffer);
  return filename;
}

export function photoStorageDir(): string {
  return STORAGE_DIR;
}

export function photoUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/api/attendance/photo/${filename}`;
}
