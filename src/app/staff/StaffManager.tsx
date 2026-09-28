"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffRole } from "@/lib/constants";

type Staff = { id: string; name: string; phone: string | null; role: string; active: boolean };

export default function StaffManager({ initialStaff }: { initialStaff: Staff[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>(StaffRole.MEMBER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("氏名を入力してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, role }),
      });
      if (!res.ok) throw new Error("追加に失敗しました");
      setName("");
      setPhone("");
      setRole(StaffRole.MEMBER);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(staff: Staff) {
    await fetch(`/api/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !staff.active }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">スタッフを追加</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            氏名
            <input
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="text-sm">
            電話番号
            <input
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="text-sm">
            役割
            <select
              className="mt-1 w-full rounded border px-2 py-1.5"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value={StaffRole.MEMBER}>メンバー</option>
              <option value={StaffRole.LEADER}>リーダー</option>
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          追加
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">氏名</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">役割</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">電話番号</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">状態</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {initialStaff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2">{s.role === StaffRole.LEADER ? "リーダー" : "メンバー"}</td>
                <td className="px-3 py-2">{s.phone ?? "-"}</td>
                <td className="px-3 py-2">
                  <span className={s.active ? "text-emerald-600" : "text-slate-400"}>
                    {s.active ? "稼働中" : "休止中"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleActive(s)} className="text-xs text-sky-600 hover:underline">
                    {s.active ? "休止にする" : "稼働に戻す"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
