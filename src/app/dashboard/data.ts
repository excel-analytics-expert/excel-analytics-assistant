import { prisma } from "@/lib/prisma";
import { todayJST, addDaysToDateString, formatDateJP, formatTimeJP, minutesLate } from "@/lib/date";
import { StaffRole } from "@/lib/constants";
import { photoUrl } from "@/lib/photo-storage";

// working: 出勤中 / done: 退勤済 / before: 開始時刻前で未出勤 / late: 開始時刻を過ぎても未出勤
export type StaffState = "working" | "done" | "before" | "late";

export type StaffRow = {
  id: string;
  name: string;
  isLeader: boolean;
  state: StaffState;
  clockIn: string | null;
  clockOut: string | null;
  lateMinutes: number;
  inPhoto: string | null;
  outPhoto: string | null;
};

export type SiteCard = {
  shiftId: string;
  siteId: string;
  siteName: string;
  startTime: string;
  endTime: string;
  required: number;
  assigned: number;
  short: boolean;
  staff: StaffRow[];
};

export type IncidentItem = {
  id: string;
  kind: "TROUBLE" | "LATE";
  isToday: boolean;
  dateLabel: string;
  time: string;
  siteName: string;
  staffName: string;
  message: string;
  photo: string | null;
};

export type WeekDay = {
  date: string;
  label: string;
  sites: { siteId: string; siteName: string; assigned: number; required: number; hasShift: boolean }[];
};

export type DashboardData = {
  todayLabel: string;
  generatedAt: string;
  summary: {
    working: number;
    done: number;
    notYet: number;
    late: number;
    shortSites: number;
    todayIncidents: number;
  };
  siteCards: SiteCard[];
  incidents: IncidentItem[];
  week: WeekDay[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const today = todayJST();
  const weekEnd = addDaysToDateString(today, 6);
  const nowHHmm = formatTimeJP(new Date());

  const [sites, weekShifts, incidentReports] = await Promise.all([
    prisma.site.findMany({ orderBy: { name: "asc" } }),
    prisma.shift.findMany({
      where: { date: { gte: today, lte: weekEnd } },
      include: { site: true, assignments: { include: { staff: true } }, attendances: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.incidentReport.findMany({
      where: { shift: { date: { gte: addDaysToDateString(today, -6), lte: weekEnd } } },
      include: { staff: true, shift: { include: { site: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const siteCards: SiteCard[] = weekShifts
    .filter((s) => s.date === today)
    .map((shift) => {
      const staff: StaffRow[] = shift.assignments.map((a) => {
        const att = shift.attendances.find((x) => x.staffId === a.staffId);
        const state: StaffState = att?.clockOut
          ? "done"
          : att?.clockIn
            ? "working"
            : nowHHmm >= shift.startTime
              ? "late"
              : "before";
        return {
          id: a.id,
          name: a.staff.name,
          isLeader: a.staff.role === StaffRole.LEADER,
          state,
          clockIn: att?.clockIn ? formatTimeJP(att.clockIn) : null,
          clockOut: att?.clockOut ? formatTimeJP(att.clockOut) : null,
          lateMinutes: att?.clockIn ? minutesLate(shift.date, shift.startTime, att.clockIn) : 0,
          inPhoto: photoUrl(att?.clockInPhotoPath),
          outPhoto: photoUrl(att?.clockOutPhotoPath),
        };
      });
      const required = shift.site.requiredHeadcount;
      return {
        shiftId: shift.id,
        siteId: shift.siteId,
        siteName: shift.site.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        required,
        assigned: staff.length,
        short: staff.length < required,
        staff,
      };
    });

  const allStaff = siteCards.flatMap((c) => c.staff);
  const count = (state: StaffState) => allStaff.filter((s) => s.state === state).length;

  const incidents: IncidentItem[] = incidentReports.map((r) => ({
    id: r.id,
    kind: r.kind === "LATE" ? "LATE" : "TROUBLE",
    isToday: r.shift.date === today,
    dateLabel: formatDateJP(r.shift.date),
    time: formatTimeJP(r.createdAt),
    siteName: r.shift.site.name,
    staffName: r.staff.name,
    message: r.message,
    photo: photoUrl(r.photoPath),
  }));

  const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysToDateString(today, i);
    return {
      date,
      label: formatDateJP(date),
      sites: sites.map((site) => {
        const shifts = weekShifts.filter((s) => s.date === date && s.siteId === site.id);
        return {
          siteId: site.id,
          siteName: site.name,
          assigned: shifts.reduce((sum, s) => sum + s.assignments.length, 0),
          required: site.requiredHeadcount * shifts.length,
          hasShift: shifts.length > 0,
        };
      }),
    };
  });

  return {
    todayLabel: formatDateJP(today),
    generatedAt: nowHHmm,
    summary: {
      working: count("working"),
      done: count("done"),
      notYet: count("before") + count("late"),
      late: count("late"),
      shortSites: siteCards.filter((c) => c.short).length,
      todayIncidents: incidents.filter((i) => i.isToday).length,
    },
    siteCards,
    incidents,
    week,
  };
}
