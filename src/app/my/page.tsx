import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@/lib/constants";

export const dynamic = "force-dynamic";

// スタッフ用：自分の名前を選ぶと、自分の予定（現場・時間・地図）が見られる
export default async function MyIndexPage() {
  const staff = await prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-bold">自分の予定を見る</h1>
        <p className="mt-1 text-sm text-slate-500">
          ご自身の名前をタップすると、今後7日間の現場・時間・地図が表示されます。
        </p>
      </div>
      <div className="grid gap-3">
        {staff.map((s) => (
          <Link
            key={s.id}
            href={`/my/${s.id}`}
            className="rounded-lg border bg-white py-4 text-center text-lg font-medium shadow-sm active:bg-slate-100"
          >
            {s.name}
            {s.role === StaffRole.LEADER && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">リーダー</span>
            )}
          </Link>
        ))}
        {staff.length === 0 && <p className="text-center text-sm text-slate-500">スタッフが登録されていません。</p>}
      </div>
    </div>
  );
}
