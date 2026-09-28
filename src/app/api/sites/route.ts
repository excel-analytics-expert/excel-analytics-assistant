import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sites = await prisma.site.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, requiredHeadcount, defaultStartTime, defaultEndTime } = body as {
    name: string;
    address?: string;
    requiredHeadcount: number;
    defaultStartTime: string;
    defaultEndTime: string;
  };

  if (!name) {
    return NextResponse.json({ error: "現場名を入力してください" }, { status: 400 });
  }

  const site = await prisma.site.create({
    data: {
      name,
      address: address || null,
      requiredHeadcount: requiredHeadcount || 1,
      defaultStartTime: defaultStartTime || "09:00",
      defaultEndTime: defaultEndTime || "17:00",
    },
  });

  return NextResponse.json(site, { status: 201 });
}
