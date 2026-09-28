import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { todayJST } from "@/lib/date";

// 表示中のQRコードはこの間隔で新しいものに切り替わる
export const QR_ROTATION_SECONDS = 60;
// 各QRコードは発行からこの時間だけ有効。読み取り後に名前選択・写真撮影をしている間に失効しないよう、
// 切り替え間隔より長めにとる。写真で撮っておいて後から使う不正はこの時間を過ぎると無効になる。
export const QR_TOKEN_TTL_SECONDS = 5 * 60;

/**
 * 現場の「今表示すべき」QRトークンを返す。直近の発行から切り替え間隔が経っていなければ同じものを返し、
 * 経っていれば新規発行する（古いトークンは自身の有効期限までは使える）。
 */
export async function getCurrentQrToken(siteId: string) {
  const now = Date.now();

  const latest = await prisma.dailyQrToken.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });
  if (latest && now - latest.createdAt.getTime() < QR_ROTATION_SECONDS * 1000) {
    return latest;
  }

  return prisma.dailyQrToken.create({
    data: {
      siteId,
      date: todayJST(),
      token: randomBytes(20).toString("hex"),
      expiresAt: new Date(now + QR_TOKEN_TTL_SECONDS * 1000),
    },
  });
}

export type TokenValidation =
  | { valid: true; siteId: string; date: string }
  | { valid: false; reason: "not_found" | "expired" };

export async function validateQrToken(token: string): Promise<TokenValidation> {
  const record = await prisma.dailyQrToken.findUnique({ where: { token } });
  if (!record) return { valid: false, reason: "not_found" };

  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, siteId: record.siteId, date: record.date };
}

export function attendUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/attend/${token}`;
}

// 端末の時計ずれの影響を受けないよう、絶対時刻ではなく「切り替えまでの残りミリ秒」を返す
export type QrPayload = { url: string; dataUrl: string; msUntilRotation: number };

export async function buildCurrentQrPayload(siteId: string): Promise<QrPayload> {
  const qrToken = await getCurrentQrToken(siteId);
  const url = attendUrl(qrToken.token);
  const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 });
  const rotatesAt = qrToken.createdAt.getTime() + QR_ROTATION_SECONDS * 1000;
  return { url, dataUrl, msUntilRotation: Math.max(rotatesAt - Date.now(), 0) };
}
