import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: from,
        lte: to,
      },
    },
    include: {
      site: true,
      assignments: { include: { staff: true } },
      attendances: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { siteId, date, startTime, endTime, staffIds } = body as {
    siteId: string;
    date: string;
    startTime: string;
    endTime: string;
    staffIds: string[];
  };

  if (!siteId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const shift = await prisma.shift.create({
    data: {
      siteId,
      date,
      startTime,
      endTime,
      assignments: {
        create: (staffIds ?? []).map((staffId) => ({ staffId })),
      },
    },
    include: { assignments: true },
  });

  return NextResponse.json(shift, { status: 201 });
}
