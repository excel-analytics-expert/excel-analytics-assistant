import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバーをPCのIPアドレス（例: http://192.168.1.10:3000）で開くと、Next.jsは既定で
  // 画面のJavaScriptをブロックし、スマホで打刻ボタンが動かない。社内LAN（プライベートIP）だけ許可する。
  // 開発時のみ有効で、本番ビルドには影響しない。
  // それ以外（トンネル等）は DEV_ALLOWED_ORIGINS にカンマ区切りで追加できる。
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
    ...(process.env.DEV_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ],
};

export default nextConfig;
