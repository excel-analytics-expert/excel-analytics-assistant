import Link from "next/link";
import type { DashboardData, SiteCard, StaffRow, IncidentItem } from "./data";

// 状態は色だけに頼らず、必ずアイコン＋文字で表す
const STATE_LABEL: Record<StaffRow["state"], { icon: string; className: string }> = {
  working: { icon: "●", className: "text-emerald-700" },
  done: { icon: "✓", className: "text-slate-500" },
  before: { icon: "○", className: "text-slate-400" },
  late: { icon: "⚠", className: "text-red-700 font-semibold" },
};

function stateText(s: StaffRow): string {
  switch (s.state) {
    case "working":
      return `出勤中 ${s.clockIn}〜`;
    case "done":
      return `退勤 ${s.clockOut}`;
    case "before":
      return "出勤前";
    case "late":
      return "未出勤";
  }
}

export function StaffStatus({ staff }: { staff: StaffRow }) {
  const { icon, className } = STATE_LABEL[staff.state];
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span aria-hidden>{icon}</span> {stateText(staff)}
      {staff.lateMinutes > 0 && (
        <span className="ml-1 rounded bg-red-50 px-1 text-xs font-semibold text-red-700">
          ⚠ 遅刻{staff.lateMinutes}分
        </span>
      )}
    </span>
  );
}

export function PhotoLinks({ staff }: { staff: StaffRow }) {
  if (!staff.inPhoto && !staff.outPhoto) return null;
  return (
    <span className="flex gap-3 text-xs">
      {staff.inPhoto && (
        <a href={staff.inPhoto} target="_blank" rel="noreferrer" className="text-sky-700 underline">
          出勤写真
        </a>
      )}
      {staff.outPhoto && (
        <a href={staff.outPhoto} target="_blank" rel="noreferrer" className="text-sky-700 underline">
          退勤写真
        </a>
      )}
    </span>
  );
}

export function LeaderBadge() {
  return <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">リーダー</span>;
}

export function StaffingChip({ card }: { card: SiteCard }) {
  return card.short ? (
    <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      ⚠ 人員不足 {card.assigned}/{card.required}人
    </span>
  ) : (
    <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
      ✓ 充足 {card.assigned}/{card.required}人
    </span>
  );
}

function Tile({
  label,
  value,
  unit,
  note,
  alert,
}: {
  label: string;
  value: number;
  unit: string;
  note: { text: string; bad: boolean };
  alert: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-3 md:p-4 ${alert ? "border-red-300 border-l-4 border-l-red-500" : "border-slate-200"}`}
    >
      <p className="text-xs text-slate-500 md:text-sm">{label}</p>
      <p className="mt-1 text-slate-900">
        <span className="text-2xl font-bold tabular-nums md:text-3xl">{value}</span>
        <span className="ml-0.5 text-sm text-slate-600">{unit}</span>
      </p>
      <p className={`mt-1 text-xs ${note.bad ? "font-semibold text-red-700" : "text-slate-500"}`}>
        {note.text}
      </p>
    </div>
  );
}

export function StatTiles({ summary, incidentCount }: { summary: DashboardData["summary"]; incidentCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
      <Tile
        label="出勤中"
        value={summary.working}
        unit="人"
        note={{ text: `退勤済み ${summary.done}人`, bad: false }}
        alert={false}
      />
      <Tile
        label="未出勤"
        value={summary.notYet}
        unit="人"
        note={
          summary.late > 0
            ? { text: `⚠ うち開始時刻を過ぎた人 ${summary.late}人`, bad: true }
            : { text: "✓ 遅れなし", bad: false }
        }
        alert={summary.late > 0}
      />
      <Tile
        label="人員不足の現場"
        value={summary.shortSites}
        unit="現場"
        note={summary.shortSites > 0 ? { text: "⚠ 要確認", bad: true } : { text: "✓ 全現場充足", bad: false }}
        alert={summary.shortSites > 0}
      />
      <Tile
        label="本日の報告・届出"
        value={summary.todayIncidents}
        unit="件"
        note={{ text: `直近7日 ${incidentCount}件`, bad: false }}
        alert={false}
      />
    </div>
  );
}

export function IncidentCard({ item }: { item: IncidentItem }) {
  const late = item.kind === "LATE";
  return (
    <li
      className={`rounded-lg border p-3 text-sm ${late ? "border-sky-200 bg-sky-50" : "border-amber-200 bg-amber-50"}`}
    >
      <p className="text-xs text-slate-600">
        <span
          className={`mr-1 rounded px-1.5 py-0.5 font-semibold ${late ? "bg-sky-200 text-sky-900" : "bg-amber-200 text-amber-900"}`}
        >
          {late ? "遅刻・遅延届" : "トラブル"}
        </span>
        {item.isToday ? "今日" : item.dateLabel} {item.time}・{item.siteName}・{item.staffName}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-slate-900">{item.message}</p>
      {item.photo && (
        <a href={item.photo} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-sky-700 underline">
          {late ? "遅延証明書を見る" : "写真を見る"}
        </a>
      )}
    </li>
  );
}

export function QrLink({ siteId }: { siteId: string }) {
  return (
    <Link
      href={`/sites/${siteId}/qr`}
      className="whitespace-nowrap rounded border border-sky-200 px-2 py-1 text-xs text-sky-700"
    >
      QR表示
    </Link>
  );
}
