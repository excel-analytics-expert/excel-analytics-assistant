import { prisma } from "@/lib/prisma";
import { StaffRole } from "@/lib/constants";
import { addDaysToDateString } from "@/lib/date";

export type AutoAssignInput = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD" (inclusive)
  siteIds: string[];
};

export type AutoAssignResult = {
  createdShifts: number;
  skippedExistingShifts: number;
  totalAssignments: number;
  shortfalls: { date: string; siteName: string; needed: number; assigned: number }[];
};

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cur = start;
  // 安全のため最大90日でガード
  for (let i = 0; i < 90 && cur <= end; i++) {
    dates.push(cur);
    cur = addDaysToDateString(cur, 1);
  }
  return dates;
}

/**
 * 指定期間・現場に対して、必要人数を満たすようシフトとスタッフ割り当てを自動生成する簡易アルゴリズム。
 * - 同一スタッフを同一日に複数現場へ重複割り当てしない
 * - 割り当て回数が少ないスタッフから優先的に割り当て、公平に分散させる
 * - 可能な限り現場ごとに最低1名リーダーを含める
 * - 既にシフトが存在する日・現場はスキップする（重複作成しない）
 */
export async function autoAssignShifts(input: AutoAssignInput): Promise<AutoAssignResult> {
  const dates = dateRange(input.startDate, input.endDate);
  if (dates.length === 0) {
    return { createdShifts: 0, skippedExistingShifts: 0, totalAssignments: 0, shortfalls: [] };
  }

  const [sites, staffList, existingShifts] = await Promise.all([
    prisma.site.findMany({ where: { id: { in: input.siteIds } } }),
    prisma.staff.findMany({ where: { active: true } }),
    prisma.shift.findMany({
      where: {
        siteId: { in: input.siteIds },
        date: { in: dates },
      },
      select: { id: true, siteId: true, date: true },
    }),
  ]);

  const existingKey = new Set(existingShifts.map((s) => `${s.siteId}__${s.date}`));

  // 割り当て回数トラッキング（少ない人を優先）
  const assignmentCount = new Map<string, number>();
  staffList.forEach((s) => assignmentCount.set(s.id, 0));

  // 同一日の重複防止用: date -> Set<staffId>
  const bookedOnDate = new Map<string, Set<string>>();
  dates.forEach((d) => bookedOnDate.set(d, new Set()));

  const result: AutoAssignResult = {
    createdShifts: 0,
    skippedExistingShifts: 0,
    totalAssignments: 0,
    shortfalls: [],
  };

  function pickStaff(date: string, count: number, requireLeader: boolean) {
    const booked = bookedOnDate.get(date)!;
    const available = staffList.filter((s) => !booked.has(s.id));
    const sorted = [...available].sort(
      (a, b) => (assignmentCount.get(a.id) ?? 0) - (assignmentCount.get(b.id) ?? 0)
    );

    const picked: typeof staffList = [];

    if (requireLeader) {
      const leader = sorted.find((s) => s.role === StaffRole.LEADER);
      if (leader) {
        picked.push(leader);
      }
    }

    for (const s of sorted) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.id === s.id)) continue;
      picked.push(s);
    }

    picked.forEach((s) => {
      booked.add(s.id);
      assignmentCount.set(s.id, (assignmentCount.get(s.id) ?? 0) + 1);
    });

    return picked;
  }

  for (const date of dates) {
    for (const site of sites) {
      const key = `${site.id}__${date}`;
      if (existingKey.has(key)) {
        result.skippedExistingShifts++;
        continue;
      }

      const picked = pickStaff(date, site.requiredHeadcount, true);

      const shift = await prisma.shift.create({
        data: {
          siteId: site.id,
          date,
          startTime: site.defaultStartTime,
          endTime: site.defaultEndTime,
        },
      });
      result.createdShifts++;

      if (picked.length > 0) {
        await prisma.shiftAssignment.createMany({
          data: picked.map((s) => ({ shiftId: shift.id, staffId: s.id })),
        });
        result.totalAssignments += picked.length;
      }

      if (picked.length < site.requiredHeadcount) {
        result.shortfalls.push({
          date,
          siteName: site.name,
          needed: site.requiredHeadcount,
          assigned: picked.length,
        });
      }
    }
  }

  return result;
}
