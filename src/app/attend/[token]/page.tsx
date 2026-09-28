import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr-token";
import { buildMapLinks } from "@/lib/maps";
import AttendClient from "./AttendClient";

export const dynamic = "force-dynamic";

export default async function AttendPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const validation = await validateQrToken(token);

  if (!validation.valid) {
    return (
      <div className="mx-auto max-w-sm text-center space-y-3 py-10">
        <h1 className="text-lg font-bold text-red-600">このQRコードは使用できません</h1>
        <p className="text-sm text-slate-600">
          {validation.reason === "expired"
            ? "期限切れのQRコードです。QRコードは1分ごとに切り替わります。リーダーの端末に表示されている最新のQRコードをその場で読み取ってください。"
            : "無効なQRコードです。管理者に確認してください。"}
        </p>
      </div>
    );
  }

  const site = await prisma.site.findUnique({ where: { id: validation.siteId } });
  if (!site) {
    return (
      <div className="mx-auto max-w-sm text-center py-10">
        <p className="text-red-600">現場情報が見つかりません。</p>
      </div>
    );
  }

  const shifts = await prisma.shift.findMany({
    where: { siteId: validation.siteId, date: validation.date },
    include: { assignments: { include: { staff: true } }, attendances: true },
    orderBy: { startTime: "asc" },
  });

  const staffMap = new Map<
    string,
    { staffId: string; name: string; role: string; clockIn: string | null; clockOut: string | null }
  >();

  for (const shift of shifts) {
    for (const assignment of shift.assignments) {
      if (staffMap.has(assignment.staffId)) continue;
      const attendance = shift.attendances.find((a) => a.staffId === assignment.staffId);
      staffMap.set(assignment.staffId, {
        staffId: assignment.staffId,
        name: assignment.staff.name,
        role: assignment.staff.role,
        clockIn: attendance?.clockIn?.toISOString() ?? null,
        clockOut: attendance?.clockOut?.toISOString() ?? null,
      });
    }
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <AttendClient
        token={token}
        site={{
          name: site.name,
          address: site.address,
          startTime: shifts[0]?.startTime ?? null,
          endTime: shifts[0]?.endTime ?? null,
          ...buildMapLinks(site),
        }}
        staffList={Array.from(staffMap.values())}
      />
    </div>
  );
}
