import { headers } from "next/headers";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/**
 * QRコードに埋め込む公開URLのベース。APP_BASE_URL が設定されていればそれを使い、
 * 未設定なら「この画面を開いたときのURL」をそのまま使う（PCのIPで開けばスマホからも届く）。
 */
export async function resolveBaseUrl(): Promise<string> {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim();
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

/** localhost 等はスマホから見ると「スマホ自身」を指してしまい開けない */
export function isReachableFromPhone(baseUrl: string): boolean {
  try {
    return !LOCAL_HOSTNAMES.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}
