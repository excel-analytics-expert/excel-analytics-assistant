import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "清掃シフト管理",
  description: "清掃業向けシフト管理・出退勤ダッシュボード",
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/shifts", label: "シフト管理" },
  { href: "/shifts/generate", label: "自動シフト作成" },
  { href: "/sites", label: "現場QRコード" },
  { href: "/staff", label: "スタッフ管理" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-bold text-lg tracking-tight">清掃シフト管理</span>
            <nav className="flex flex-wrap gap-4 text-sm">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-sky-300">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
