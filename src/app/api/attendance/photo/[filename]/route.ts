import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { photoStorageDir } from "@/lib/photo-storage";

const SAFE_FILENAME = /^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(photoStorageDir(), filename));
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
