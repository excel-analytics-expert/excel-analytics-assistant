import Link from "next/link";
import type { DashboardData } from "./data";
import RefreshButton from "./RefreshButton";
import { StatTiles, StaffStatus, PhotoLinks, LeaderBadge, StaffingChip, IncidentCard, QrLink } from "./parts";

const INCIDENTS_SHOWN = 3;

// 画面幅768px未満（スマホ）用。縦一列で、横スクロールなしに「今すぐ知りたいこと」から順に並べる。
export default function PhoneView({ data }: { data: DashboardData }) {
  const { summary, siteCards, incidents, week } = data;
  const firstIncidents = incidents.slice(0, INCIDENTS_SHOWN);
  const restIncidents = incidents.slice(INCIDENTS_SHOWN);

  return (
    <div className="space-y-6 md:hidden">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">ダッシュボード</h1>
          <p className="text-xs text-slate-500">本日: {data.todayLabel}</p>
        </div>
        <RefreshButton generatedAt={data.generatedAt} />
      </div>

      <StatTiles summary={summary} incidentCount={incidents.length} />

      <section>
        <h2 className="mb-2 text-base font-semibold">本日の現場</h2>
        {siteCards.length === 0 ? (
          <p className="text-sm text-slate-500">本日のシフトは登録されていません。</p>
        ) : (
          <div className="space-y-3">
            {siteCards.map((card) => (
              <div key={card.shiftId} className="rounded-lg border bg-white p-3 shadow-sm">
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
                <ul className="mt-2 divide-y text-sm">
                  {card.staff.map((s) => (
                    <li key={s.id} className="py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {s.name}
                          {s.isLeader && <LeaderBadge />}
                        </span>
                        <StaffStatus staff={s} />
                      </div>
                      <div className="mt-1 flex justify-end">
                        <PhotoLinks staff={s} />
                      </div>
                    </li>
                  ))}
                  {card.staff.length === 0 && <li className="py-2 text-red-700">⚠ 担当者未割当</li>}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">報告・届出（トラブル／遅刻）</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">報告はありません。</p>
        ) : (
          <>
            <ul className="space-y-2">
              {firstIncidents.map((i) => (
                <IncidentCard key={i.id} item={i} />
              ))}
            </ul>
            {restIncidents.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer py-2 text-sm text-sky-700">
                  さらに {restIncidents.length} 件を表示
                </summary>
                <ul className="mt-2 space-y-2">
                  {restIncidents.map((i) => (
                    <IncidentCard key={i.id} item={i} />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">今週の予定</h2>
        <div className="divide-y rounded-lg border bg-white text-sm shadow-sm">
          {week.map((d, idx) => (
            <details key={d.date} open={idx === 0} className="px-3">
              <summary className="flex cursor-pointer items-center justify-between py-3">
                <span className="font-medium">{d.label}</span>
                <span className="text-xs text-slate-500">
                  {d.sites.every((s) => !s.hasShift)
                    ? "シフトなし"
                    : d.sites.some((s) => s.hasShift && s.assigned < s.required)
                      ? "⚠ 人員不足あり"
                      : "✓ 充足"}
                </span>
              </summary>
              <ul className="space-y-1 pb-3">
                {d.sites
                  .filter((s) => s.hasShift)
                  .map((s) => (
                    <li key={s.siteId} className="flex justify-between">
                      <span>{s.siteName}</span>
                      <span
                        className={
                          s.assigned < s.required ? "font-semibold text-red-700" : "text-slate-700"
                        }
                      >
                        {s.assigned < s.required && "⚠ "}
                        {s.assigned}/{s.required}人
                      </span>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <Link href="/shifts" className="py-2 text-sky-700 underline">
            シフト一覧
          </Link>
          <Link href="/shifts/generate" className="py-2 text-sky-700 underline">
            自動シフト作成
          </Link>
        </div>
      </section>
    </div>
  );
}
