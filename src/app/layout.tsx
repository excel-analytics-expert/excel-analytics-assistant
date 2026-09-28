import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "清掃シフト管理",
  description: "清掃業向けシフト管理・出退勤ダッシュボード",
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/my", label: "自分の予定" },
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
          <div className="mx-auto max-w-6xl px-4 pt-3 md:flex md:items-center md:gap-6 md:py-3">
            <span className="block whitespace-nowrap text-lg font-bold tracking-tight">清掃シフト管理</span>
            {/* スマホでは1行に収め、はみ出す分は横にスワイプ。PCでは通常の横並び */}
            <nav className="-mx-4 mt-1 flex gap-1 overflow-x-auto px-3 text-sm md:mx-0 md:mt-0 md:overflow-visible md:px-0">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap px-2 py-3 hover:text-sky-300 md:px-2 md:py-0"
                >
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
