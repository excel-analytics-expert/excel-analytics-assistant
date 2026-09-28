import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMapLinks } from "@/lib/maps";
import { todayJST, addDaysToDateString, formatDateJP, formatTimeJP } from "@/lib/date";
import SiteInfoCard from "@/components/SiteInfoCard";

export const dynamic = "force-dynamic";

export default async function MySchedulePage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.active) notFound();

  const today = todayJST();
  const shifts = await prisma.shift.findMany({
    where: {
      date: { gte: today, lte: addDaysToDateString(today, 6) },
      assignments: { some: { staffId } },
    },
    include: { site: true, attendances: { where: { staffId } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-bold">{staff.name} さんの予定</h1>
        <p className="mt-1 text-sm text-slate-500">今後7日間（本日 {formatDateJP(today)} から）</p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        現場に着いたら、現場にいるリーダーの端末に表示されているQRコードを読み取って、出勤を打刻してください。
      </div>

      {shifts.length === 0 ? (
        <p className="rounded-lg border bg-white p-4 text-sm text-slate-600">この期間の予定はありません。</p>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => {
            const att = shift.attendances[0];
            const status = att?.clockOut
              ? `✓ 退勤済み ${formatTimeJP(att.clockOut)}`
              : att?.clockIn
                ? `● 出勤中 ${formatTimeJP(att.clockIn)}〜`
                : null;
            return (
              <div key={shift.id} className="space-y-1">
                <SiteInfoCard
                  heading={shift.date === today ? `今日（${formatDateJP(shift.date)}）` : formatDateJP(shift.date)}
                  site={{
                    name: shift.site.name,
                    address: shift.site.address,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    ...buildMapLinks(shift.site),
                  }}
                />
                {status && <p className="px-1 text-sm font-medium text-emerald-800">{status}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Link href="/my" className="inline-block py-2 text-sm text-sky-700 underline">
        別の人の予定を見る
      </Link>
    </div>
  );
}
