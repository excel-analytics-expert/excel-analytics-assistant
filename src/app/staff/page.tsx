import { prisma } from "@/lib/prisma";
import StaffManager from "./StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">スタッフ管理</h1>
      <StaffManager initialStaff={staff} />
    </div>
  );
}
