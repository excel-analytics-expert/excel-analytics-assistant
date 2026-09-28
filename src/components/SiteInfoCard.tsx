export type SiteInfo = {
  name: string;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  openUrl: string;
  routeUrl: string;
};

// スタッフのスマホ用：どの現場か・時間・住所と、Googleマップへのボタン
export default function SiteInfoCard({ site, heading }: { site: SiteInfo; heading?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {heading && <p className="text-xs font-medium text-slate-500">{heading}</p>}
      <p className="text-lg font-bold leading-snug">{site.name}</p>
      {site.startTime && site.endTime && (
        <p className="mt-0.5 text-sm text-slate-600">
          {site.startTime}〜{site.endTime}
        </p>
      )}
      {site.address && <p className="mt-1 text-sm text-slate-700">📍 {site.address}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={site.routeUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-sky-700 py-3 text-center text-sm font-medium text-white"
        >
          経路を案内
        </a>
        <a
          href={site.openUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-sky-700 py-3 text-center text-sm font-medium text-sky-800"
        >
          地図で見る
        </a>
      </div>
      <p className="mt-2 text-xs text-slate-500">Googleマップが開きます</p>
    </div>
  );
}
