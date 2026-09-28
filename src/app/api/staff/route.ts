import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@/lib/constants";

export async function GET() {
  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, role } = body as { name: string; phone?: string; role?: string };

  if (!name) {
    return NextResponse.json({ error: "氏名を入力してください" }, { status: 400 });
  }

  const staff = await prisma.staff.create({
    data: {
      name,
      phone: phone || null,
      role: role === StaffRole.LEADER ? StaffRole.LEADER : StaffRole.MEMBER,
    },
  });

  return NextResponse.json(staff, { status: 201 });
}
