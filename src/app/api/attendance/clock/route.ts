import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr-token";
import { ClockMethod } from "@/lib/constants";
import { formatTimeJP } from "@/lib/date";
import { savePhotoDataUrl, InvalidPhotoError } from "@/lib/photo-storage";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, staffId, action, photoDataUrl } = body as {
    token: string;
    staffId: string;
    action: "IN" | "OUT";
    photoDataUrl?: string;
  };

  if (!token || !staffId || (action !== "IN" && action !== "OUT")) {
    return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
  }

  const validation = await validateQrToken(token);
  if (!validation.valid) {
    const message =
      validation.reason === "expired"
        ? "このQRコードは本日分ではありません。現場に掲示されている最新のQRコードを読み取ってください。"
        : "無効なQRコードです。";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const shift = await prisma.shift.findFirst({
    where: {
      siteId: validation.siteId,
      date: validation.date,
      assignments: { some: { staffId } },
    },
    orderBy: { startTime: "asc" },
  });

  if (!shift) {
    return NextResponse.json(
      { error: "本日この現場のシフトに割り当てられていません。管理者に確認してください。" },
      { status: 400 }
    );
  }

  let photoFilename: string | null = null;
  if (photoDataUrl) {
    try {
      photoFilename = await savePhotoDataUrl(photoDataUrl);
    } catch (err) {
      if (err instanceof InvalidPhotoError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const existing = await prisma.attendance.findUnique({
    where: { shiftId_staffId: { shiftId: shift.id, staffId } },
  });

  if (action === "IN") {
    if (existing?.clockIn) {
      return NextResponse.json({
        message: `既に ${formatTimeJP(existing.clockIn)} に出勤済みです。`,
        attendance: existing,
      });
    }
    const attendance = await prisma.attendance.upsert({
      where: { shiftId_staffId: { shiftId: shift.id, staffId } },
      create: {
        shiftId: shift.id,
        staffId,
        clockIn: new Date(),
        clockInMethod: ClockMethod.QR,
        clockInPhotoPath: photoFilename,
      },
      update: {
        clockIn: new Date(),
        clockInMethod: ClockMethod.QR,
        clockInPhotoPath: photoFilename,
      },
    });
    return NextResponse.json({ message: "出勤を記録しました。", attendance });
  }

  if (!existing?.clockIn) {
    return NextResponse.json(
      { error: "出勤記録がありません。先に出勤の打刻を行ってください。" },
      { status: 400 }
    );
  }
  if (existing.clockOut) {
    return NextResponse.json({
      message: `既に ${formatTimeJP(existing.clockOut)} に退勤済みです。`,
      attendance: existing,
    });
  }

  const attendance = await prisma.attendance.update({
    where: { shiftId_staffId: { shiftId: shift.id, staffId } },
    data: {
      clockOut: new Date(),
      clockOutMethod: ClockMethod.QR,
      clockOutPhotoPath: photoFilename,
    },
  });
  return NextResponse.json({ message: "退勤を記録しました。", attendance });
}
