// 登録されたURLはスタッフのスマホにリンクとして表示されるため、Googleマップ以外（偽サイト・javascript:等）は受け付けない
const ALLOWED_MAP_HOSTS = new Set([
  "www.google.com",
  "google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

export function normalizeMapUrl(input: string | null | undefined): string | null {
  const value = input?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED_MAP_HOSTS.has(url.hostname)) return null;
    const isGoogleHost = url.hostname.endsWith("google.com");
    if (isGoogleHost && !url.pathname.startsWith("/maps")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export type MapLinks = {
  /** 場所をGoogleマップで開く */
  openUrl: string;
  /** 現在地からこの現場までの経路案内を開く */
  routeUrl: string;
};

export function buildMapLinks(site: { name: string; address: string | null; mapUrl: string | null }): MapLinks {
  const query = encodeURIComponent(site.address ? `${site.address} ${site.name}` : site.name);
  const pinned = normalizeMapUrl(site.mapUrl);
  return {
    openUrl: pinned ?? `https://www.google.com/maps/search/?api=1&query=${query}`,
    routeUrl: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  };
}
