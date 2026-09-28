import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateJP, todayJST } from "@/lib/date";
import { buildCurrentQrPayload } from "@/lib/qr-token";
import LiveQr from "./LiveQr";

export const dynamic = "force-dynamic";

export default async function SiteQrPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) notFound();

  const initialQr = await buildCurrentQrPayload(site.id);

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">{site.name}</h1>
        <p className="text-sm text-slate-500">出退勤用QRコード（{formatDateJP(todayJST())}）</p>
        <LiveQr siteId={site.id} initialQr={initialQr} />
      </div>
      <div className="rounded-lg border bg-white p-4 text-left text-sm text-slate-700 space-y-1">
        <p className="font-semibold">読み取り方</p>
        <p>
          <span className="font-medium">iPhone：</span>
          標準の「カメラ」アプリをQRコードに向け、表示された黄色いリンクをタップ
        </p>
        <p>
          <span className="font-medium">Android：</span>
          「カメラ」アプリまたは「Googleレンズ」をQRコードに向け、表示されたリンクをタップ
        </p>
        <p className="text-xs text-slate-500">
          読み取れないときは、この画面の明るさを上げ、画面から15〜30cmほど離してください。LINEのQRコードリーダーでも読み取れます。
        </p>
      </div>
      <p className="text-xs text-slate-500">
        このQRコードは1分ごとに自動で切り替わり、表示から5分で使えなくなります。写真に撮っておいて後から打刻する不正を防ぐため、
        印刷ではなくリーダーの端末やタブレットにこの画面を表示したままにしてください。
      </p>
    </div>
  );
}
