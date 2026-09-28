const JST_TIME_ZONE = "Asia/Tokyo";

/** 日本時間での "YYYY-MM-DD" を返す（サーバーのTZ設定に依存しない） */
export function todayJST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** その日付文字列(JST基準)の 23:59:59+09:00 を UTC の Date で返す */
export function endOfDayJST(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59+09:00`);
}

/** "2026-09-28" -> "9/28(月)" のような表示用フォーマット */
export function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 3)); // 正午近辺のUTC時刻にして日付ズレを回避
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    weekday: "short",
  }).format(date);
  return `${m}/${d}(${weekday})`;
}

export function formatTimeJP(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
