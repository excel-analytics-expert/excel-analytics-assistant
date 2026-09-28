import { PrismaClient } from "@prisma/client";
import { StaffRole } from "../src/lib/constants";
import { todayJST, addDaysToDateString } from "../src/lib/date";

const prisma = new PrismaClient();

async function main() {
  await prisma.attendance.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.dailyQrToken.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.site.deleteMany();
  await prisma.staff.deleteMany();

  const [tanaka, sato, suzuki, yamada, ito] = await Promise.all([
    prisma.staff.create({ data: { name: "田中 一郎", role: StaffRole.LEADER, phone: "090-1111-2222" } }),
    prisma.staff.create({ data: { name: "佐藤 花子", role: StaffRole.LEADER, phone: "090-3333-4444" } }),
    prisma.staff.create({ data: { name: "鈴木 太郎", role: StaffRole.MEMBER, phone: "090-5555-6666" } }),
    prisma.staff.create({ data: { name: "山田 次郎", role: StaffRole.MEMBER, phone: "090-7777-8888" } }),
    prisma.staff.create({ data: { name: "伊藤 三郎", role: StaffRole.MEMBER, phone: "090-9999-0000" } }),
  ]);

  const [siteA, siteB] = await Promise.all([
    prisma.site.create({ data: { name: "渋谷オフィスビル", address: "東京都渋谷区1-1-1", requiredHeadcount: 2 } }),
    prisma.site.create({ data: { name: "新宿マンション共用部", address: "東京都新宿区2-2-2", requiredHeadcount: 1 } }),
  ]);

  const today = todayJST();

  for (let i = 0; i < 5; i++) {
    const date = addDaysToDateString(today, i);

    const shiftA = await prisma.shift.create({
      data: { siteId: siteA.id, date, startTime: "09:00", endTime: "12:00" },
    });
    await prisma.shiftAssignment.createMany({
      data: [
        { shiftId: shiftA.id, staffId: tanaka.id },
        { shiftId: shiftA.id, staffId: suzuki.id },
      ],
    });

    const shiftB = await prisma.shift.create({
      data: { siteId: siteB.id, date, startTime: "13:00", endTime: "15:00" },
    });
    await prisma.shiftAssignment.createMany({
      data: [{ shiftId: shiftB.id, staffId: sato.id }],
    });
  }

  // 山田・伊藤は未アサイン状態にしておき、自動シフト割り当て機能のデモ用に空けておく
  console.log("Seed completed:", {
    staff: 5,
    sites: 2,
    shiftsPerSite: 5,
    unassignedStaff: [yamada.name, ito.name],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
