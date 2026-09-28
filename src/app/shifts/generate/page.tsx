import { prisma } from "@/lib/prisma";
import { todayJST, addDaysToDateString } from "@/lib/date";
import GenerateForm from "./GenerateForm";

export const dynamic = "force-dynamic";

export default async function GenerateShiftsPage() {
  const sites = await prisma.site.findMany({ orderBy: { name: "asc" } });
  const today = todayJST();
  const weekLater = addDaysToDateString(today, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">自動シフト作成</h1>
        <p className="text-slate-500 text-sm mt-1">
          期間と現場を指定すると、必要人数に応じてスタッフを自動で割り当てます。
        </p>
      </div>

      <GenerateForm sites={sites} defaultStart={today} defaultEnd={weekLater} />
    </div>
  );
}
