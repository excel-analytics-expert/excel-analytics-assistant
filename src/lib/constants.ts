export const StaffRole = {
  LEADER: "LEADER",
  MEMBER: "MEMBER",
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const ReportKind = {
  TROUBLE: "TROUBLE",
  LATE: "LATE",
} as const;
export type ReportKind = (typeof ReportKind)[keyof typeof ReportKind];

export const ClockMethod = {
  QR: "QR",
  MANUAL: "MANUAL",
} as const;
export type ClockMethod = (typeof ClockMethod)[keyof typeof ClockMethod];
