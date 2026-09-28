import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMapUrl } from "@/lib/maps";

export async function GET() {
  const sites = await prisma.site.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, mapUrl, requiredHeadcount, defaultStartTime, defaultEndTime } = body as {
    name: string;
    address?: string;
    mapUrl?: string;
    requiredHeadcount: number;
    defaultStartTime: string;
    defaultEndTime: string;
  };

  if (!name) {
    return NextResponse.json({ error: "現場名を入力してください" }, { status: 400 });
  }

  const normalizedMapUrl = normalizeMapUrl(mapUrl);
  if (mapUrl?.trim() && !normalizedMapUrl) {
    return NextResponse.json(
      { error: "GoogleマップのURL（https://maps.app.goo.gl/… や https://www.google.com/maps/…）を入力してください" },
      { status: 400 }
    );
  }

  const site = await prisma.site.create({
    data: {
      name,
      address: address || null,
      mapUrl: normalizedMapUrl,
      requiredHeadcount: requiredHeadcount || 1,
      defaultStartTime: defaultStartTime || "09:00",
      defaultEndTime: defaultEndTime || "17:00",
    },
  });

  return NextResponse.json(site, { status: 201 });
}
