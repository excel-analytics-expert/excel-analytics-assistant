import { prisma } from "@/lib/prisma";
import { todayJST, addDaysToDateString } from "@/lib/date";
import ShiftForm from "./ShiftForm";
import ShiftRow from "./ShiftRow";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const today = todayJST();
  const from = addDaysToDateString(today, -7);
  const to = addDaysToDateString(today, 30);

  const [sites, staff, shifts] = await Promise.all([
    prisma.site.findMany({ orderBy: { name: "asc" } }),
    prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.shift.findMany({
      where: { date: { gte: from, lte: to } },
      include: { site: true, assignments: { include: { staff: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">シフト管理</h1>

      <ShiftForm sites={sites} staff={staff} />

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">日付</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">現場</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">時間</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">担当者</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} allStaff={staff} />
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  シフトがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
