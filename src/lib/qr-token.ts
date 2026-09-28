import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { todayJST } from "@/lib/date";
import { resolveBaseUrl, isReachableFromPhone } from "@/lib/base-url";

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
      // 128bitで十分（5分で失効）。URLを短くするとQRの目が粗くなり古いスマホでも読み取りやすい
      token: randomBytes(16).toString("hex"),
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

// 端末の時計ずれの影響を受けないよう、絶対時刻ではなく「切り替えまでの残りミリ秒」を返す
export type QrPayload = {
  url: string;
  dataUrl: string;
  msUntilRotation: number;
  reachableFromPhone: boolean;
};

export async function buildCurrentQrPayload(siteId: string): Promise<QrPayload> {
  const qrToken = await getCurrentQrToken(siteId);
  const baseUrl = await resolveBaseUrl();
  const url = `${baseUrl}/attend/${qrToken.token}`;

  // SVGなら画面の解像度に関係なく輪郭がくっきりする。余白は規格どおり4モジュール
  // （狭いとAndroidの一部カメラで読み取れない）。背景は白・前景は黒で固定。
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const rotatesAt = qrToken.createdAt.getTime() + QR_ROTATION_SECONDS * 1000;
  return {
    url,
    dataUrl,
    msUntilRotation: Math.max(rotatesAt - Date.now(), 0),
    reachableFromPhone: isReachableFromPhone(baseUrl),
  };
}
