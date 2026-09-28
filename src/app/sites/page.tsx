import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteForm from "./SiteForm";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const sites = await prisma.site.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">現場・QRコード</h1>
        <p className="text-slate-500 text-sm mt-1">
          現場ごとに、その日だけ有効なQRコードを発行できます。印刷して現場に掲示するか、タブレットに表示してください。
        </p>
      </div>

      <SiteForm />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="font-semibold">{site.name}</p>
            {site.address && <p className="text-xs text-slate-500">{site.address}</p>}
            <p className="text-sm mt-1 text-slate-600">
              必要人数 {site.requiredHeadcount}人 / {site.defaultStartTime}〜{site.defaultEndTime}
            </p>
            <Link
              href={`/sites/${site.id}/qr`}
              className="mt-3 inline-block rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              本日のQRコードを表示
            </Link>
          </div>
        ))}
        {sites.length === 0 && <p className="text-slate-400 text-sm">現場が登録されていません。</p>}
      </div>
    </div>
  );
}
