import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQrToken } from "@/lib/qr-token";
import { savePhotoDataUrl, InvalidPhotoError } from "@/lib/photo-storage";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, staffId, message, photoDataUrl } = body as {
    token: string;
    staffId: string;
    message: string;
    photoDataUrl?: string;
  };

  if (!token || !staffId || !message?.trim()) {
    return NextResponse.json({ error: "内容を入力してください。" }, { status: 400 });
  }

  const validation = await validateQrToken(token);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error:
          validation.reason === "expired"
            ? "QRコードの有効期限が切れました。最新のQRコードを読み取り直してください。"
            : "無効なQRコードです。",
      },
      { status: 400 }
    );
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
      { error: "本日この現場のシフトに割り当てられていません。" },
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

  const report = await prisma.incidentReport.create({
    data: {
      shiftId: shift.id,
      staffId,
      message: message.trim(),
      photoPath: photoFilename,
    },
  });

  return NextResponse.json({ message: "報告を送信しました。", report }, { status: 201 });
}
