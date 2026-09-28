import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCurrentQrPayload } from "@/lib/qr-token";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(await buildCurrentQrPayload(siteId), {
    headers: { "Cache-Control": "no-store" },
  });
}
