import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { startTime, endTime, staffIds } = body as {
    startTime?: string;
    endTime?: string;
    staffIds?: string[];
  };

  await prisma.shift.update({
    where: { id },
    data: {
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    },
  });

  if (staffIds) {
    await prisma.shiftAssignment.deleteMany({ where: { shiftId: id } });
    if (staffIds.length > 0) {
      await prisma.shiftAssignment.createMany({
        data: staffIds.map((staffId) => ({ shiftId: id, staffId })),
      });
    }
  }

  const updated = await prisma.shift.findUnique({
    where: { id },
    include: { assignments: { include: { staff: true } }, site: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
