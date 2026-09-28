import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { active, role } = body as { active?: boolean; role?: string };

  const staff = await prisma.staff.update({
    where: { id },
    data: {
      ...(typeof active === "boolean" ? { active } : {}),
      ...(role ? { role } : {}),
    },
  });

  return NextResponse.json(staff);
}
