import { getDashboardData } from "./data";
import PcView from "./PcView";
import PhoneView from "./PhoneView";

export const dynamic = "force-dynamic";

// 同じデータからPC用・スマホ用の2つの画面を作り、画面幅（768px）でCSSにより切り替える。
export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PcView data={data} />
      <PhoneView data={data} />
    </>
  );
}
