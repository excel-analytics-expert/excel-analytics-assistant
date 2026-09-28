import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { todayJST, endOfDayJST } from "@/lib/date";

/**
 * 現場ごとの当日分QRトークンを取得。存在しなければ新規発行する。
 * トークンは日付が変わると別の値になり、前日のQRは無効化される（動的QR）。
 */
export async function getOrCreateTodayQrToken(siteId: string) {
  const date = todayJST();

  const existing = await prisma.dailyQrToken.findUnique({
    where: { siteId_date: { siteId, date } },
  });
  if (existing) return existing;

  const token = randomBytes(20).toString("hex");
  const expiresAt = endOfDayJST(date);

  return prisma.dailyQrToken.create({
    data: { siteId, date, token, expiresAt },
  });
}

export type TokenValidation =
  | { valid: true; siteId: string; date: string }
  | { valid: false; reason: "not_found" | "expired" };

export async function validateQrToken(token: string): Promise<TokenValidation> {
  const record = await prisma.dailyQrToken.findUnique({ where: { token } });
  if (!record) return { valid: false, reason: "not_found" };

  const today = todayJST();
  if (record.date !== today || record.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, siteId: record.siteId, date: record.date };
}
