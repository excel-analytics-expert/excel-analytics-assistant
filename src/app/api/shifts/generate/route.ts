import { NextRequest, NextResponse } from "next/server";
import { autoAssignShifts } from "@/lib/auto-assign";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { startDate, endDate, siteIds } = body as {
    startDate: string;
    endDate: string;
    siteIds: string[];
  };

  if (!startDate || !endDate || !siteIds?.length) {
    return NextResponse.json({ error: "期間と現場を選択してください" }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: "開始日は終了日より前にしてください" }, { status: 400 });
  }

  const result = await autoAssignShifts({ startDate, endDate, siteIds });
  return NextResponse.json(result);
}
