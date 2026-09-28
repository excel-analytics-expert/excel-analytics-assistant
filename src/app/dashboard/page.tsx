import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayJST, addDaysToDateString, formatDateJP, formatTimeJP } from "@/lib/date";
import { StaffRole } from "@/lib/constants";
import { photoUrl } from "@/lib/photo-storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = todayJST();
  const weekEnd = addDaysToDateString(today, 6);
  const incidentsSince = addDaysToDateString(today, -6);

  const [sites, weekShifts, incidentReports] = await Promise.all([
    prisma.site.findMany({ orderBy: { name: "asc" } }),
    prisma.shift.findMany({
      where: { date: { gte: today, lte: weekEnd } },
      include: {
        site: true,
        assignments: { include: { staff: true } },
        attendances: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.incidentReport.findMany({
      where: { shift: { date: { gte: incidentsSince, lte: weekEnd } } },
      include: { staff: true, shift: { include: { site: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const todayShifts = weekShifts.filter((s) => s.date === today);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) dates.push(addDaysToDateString(today, i));

  function shiftsFor(date: string, siteId: string) {
    return weekShifts.filter((s) => s.date === date && s.siteId === siteId);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-slate-500 text-sm mt-1">本日: {formatDateJP(today)}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">トラブル・申し送り（直近7日間）</h2>
        {incidentReports.length === 0 ? (
          <p className="text-slate-500 text-sm">報告はありません。</p>
        ) : (
          <ul className="space-y-2">
            {incidentReports.map((report) => (
              <li
                key={report.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {formatDateJP(report.shift.date)} {formatTimeJP(report.createdAt)}・
                    {report.shift.site.name}・{report.staff.name}
                  </p>
                  <p className="mt-1 text-slate-800 whitespace-pre-wrap">{report.message}</p>
                </div>
                {photoUrl(report.photoPath) && (
                  <a
                    href={photoUrl(report.photoPath)!}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs text-sky-600 hover:underline whitespace-nowrap"
                  >
                    写真を見る
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">本日の現場状況</h2>
        {todayShifts.length === 0 ? (
          <p className="text-slate-500 text-sm">本日のシフトは登録されていません。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayShifts.map((shift) => {
              const required = shift.site.requiredHeadcount;
              const assigned = shift.assignments.length;
              const checkedIn = shift.attendances.filter((a) => a.clockIn).length;
              const checkedOut = shift.attendances.filter((a) => a.clockOut).length;
              const short = assigned < required;

              return (
                <div key={shift.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{shift.site.name}</p>
                      <p className="text-xs text-slate-500">
                        {shift.startTime}〜{shift.endTime}
                      </p>
                    </div>
                    <Link
                      href={`/sites/${shift.siteId}/qr`}
                      className="text-xs text-sky-600 hover:underline whitespace-nowrap"
                    >
                      QR表示
                    </Link>
                  </div>

                  <div className="mt-3 flex gap-4 text-sm">
                    <span className={short ? "text-red-600 font-medium" : "text-slate-700"}>
                      必要 {required}人 / 割当 {assigned}人
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    出勤 {checkedIn} / 退勤 {checkedOut}
                  </div>

                  <ul className="mt-3 space-y-1 text-sm">
                    {shift.assignments.map((a) => {
                      const att = shift.attendances.find((x) => x.staffId === a.staffId);
                      const status = att?.clockOut
                        ? `退勤 ${formatTimeJP(att.clockOut)}`
                        : att?.clockIn
                          ? `出勤中 (${formatTimeJP(att.clockIn)}〜)`
                          : "未出勤";
                      const inPhoto = photoUrl(att?.clockInPhotoPath);
                      const outPhoto = photoUrl(att?.clockOutPhotoPath);
                      return (
                        <li key={a.id} className="flex items-center justify-between">
                          <span>
                            {a.staff.name}
                            {a.staff.role === StaffRole.LEADER && (
                              <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                                リーダー
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <span
                              className={
                                att?.clockOut
                                  ? "text-slate-400"
                                  : att?.clockIn
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                              }
                            >
                              {status}
                            </span>
                            {inPhoto && (
                              <a href={inPhoto} target="_blank" rel="noreferrer" title="出勤時の写真">
                                📷
                              </a>
                            )}
                            {outPhoto && (
                              <a href={outPhoto} target="_blank" rel="noreferrer" title="退勤時の写真">
                                📷
                              </a>
                            )}
                          </span>
                        </li>
                      );
                    })}
                    {shift.assignments.length === 0 && (
                      <li className="text-red-500">担当者未割当</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">週間シフト状況（現場別）</h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">現場</th>
                {dates.map((d) => (
                  <th key={d} className="px-3 py-2 text-center font-medium text-slate-600">
                    {formatDateJP(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{site.name}</td>
                  {dates.map((d) => {
                    const shifts = shiftsFor(d, site.id);
                    if (shifts.length === 0) {
                      return (
                        <td key={d} className="px-3 py-2 text-center text-slate-300">
                          -
                        </td>
                      );
                    }
                    const assigned = shifts.reduce((sum, s) => sum + s.assignments.length, 0);
                    const required = site.requiredHeadcount * shifts.length;
                    const short = assigned < required;
                    return (
                      <td
                        key={d}
                        className={`px-3 py-2 text-center ${short ? "text-red-600 font-semibold" : "text-slate-700"}`}
                      >
                        {assigned}/{required}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-3 text-sm">
          <Link href="/shifts" className="text-sky-600 hover:underline">
            シフト一覧を見る
          </Link>
          <Link href="/shifts/generate" className="text-sky-600 hover:underline">
            自動でシフトを作成する
          </Link>
        </div>
      </section>
    </div>
  );
}
