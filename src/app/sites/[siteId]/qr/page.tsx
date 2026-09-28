import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayQrToken } from "@/lib/qr-token";
import { formatDateJP, todayJST } from "@/lib/date";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function SiteQrPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) notFound();

  const qrToken = await getOrCreateTodayQrToken(siteId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
  const attendUrl = `${baseUrl}/attend/${qrToken.token}`;
  const qrDataUrl = await QRCode.toDataURL(attendUrl, { width: 320, margin: 1 });

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-2">
        <h1 className="text-xl font-bold">{site.name}</h1>
        <p className="text-sm text-slate-500">出退勤用QRコード（{formatDateJP(todayJST())}）</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="出退勤QRコード" className="mx-auto my-4" width={320} height={320} />

        <p className="text-xs text-slate-400 break-all">{attendUrl}</p>
        <p className="mt-3 text-sm text-slate-600">
          このQRコードは本日のみ有効です。翌日になると自動的に新しいQRコードに切り替わります。
        </p>
      </div>
      <PrintButton />
    </div>
  );
}
