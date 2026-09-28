import Link from "next/link";
import type { DashboardData } from "./data";
import RefreshButton from "./RefreshButton";
import { StatTiles, StaffStatus, PhotoLinks, LeaderBadge, StaffingChip, IncidentCard, QrLink } from "./parts";

// 画面幅768px以上（PC・タブレット横向き）用。情報を横に並べ、全体を一画面で見渡せるようにする。
export default function PcView({ data }: { data: DashboardData }) {
  const { summary, siteCards, incidents, week } = data;
  const siteNames = week[0]?.sites ?? [];

  return (
    <div className="hidden space-y-8 md:block">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="mt-1 text-sm text-slate-500">本日: {data.todayLabel}</p>
        </div>
        <RefreshButton generatedAt={data.generatedAt} />
      </div>

      <StatTiles summary={summary} incidentCount={incidents.length} />

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2">
          <h2 className="mb-3 text-lg font-semibold">本日の現場状況</h2>
          {siteCards.length === 0 ? (
            <p className="text-sm text-slate-500">本日のシフトは登録されていません。</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {siteCards.map((card) => (
                <div key={card.shiftId} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{card.siteName}</p>
                      <p className="text-xs text-slate-500">
                        {card.startTime}〜{card.endTime}
                      </p>
                    </div>
                    <QrLink siteId={card.siteId} />
                  </div>
                  <div className="mt-2">
                    <StaffingChip card={card} />
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {card.staff.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <span>
                          {s.name}
                          {s.isLeader && <LeaderBadge />}
                        </span>
                        <span className="flex items-center gap-3">
                          <StaffStatus staff={s} />
                          <PhotoLinks staff={s} />
                        </span>
                      </li>
                    ))}
                    {card.staff.length === 0 && <li className="text-red-700">⚠ 担当者未割当</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">トラブル・申し送り（直近7日）</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-slate-500">報告はありません。</p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
              {incidents.map((i) => (
                <IncidentCard key={i.id} item={i} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">週間シフト状況（現場別・割当/必要）</h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">現場</th>
                {week.map((d) => (
                  <th key={d.date} className="px-3 py-2 text-center font-medium text-slate-600">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siteNames.map((site, idx) => (
                <tr key={site.siteId} className="border-t">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{site.siteName}</td>
                  {week.map((d) => {
                    const cell = d.sites[idx];
                    if (!cell.hasShift)
                      return (
                        <td key={d.date} className="px-3 py-2 text-center text-slate-400">
                          -
                        </td>
                      );
                    const short = cell.assigned < cell.required;
                    return (
                      <td
                        key={d.date}
                        className={`px-3 py-2 text-center tabular-nums ${short ? "bg-red-50 font-semibold text-red-700" : "text-slate-700"}`}
                      >
                        {short && <span aria-hidden>⚠ </span>}
                        {cell.assigned}/{cell.required}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <Link href="/shifts" className="text-sky-700 underline">
            シフト一覧を見る
          </Link>
          <Link href="/shifts/generate" className="text-sky-700 underline">
            自動でシフトを作成する
          </Link>
        </div>
      </section>
    </div>
  );
}
