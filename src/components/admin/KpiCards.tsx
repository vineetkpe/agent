import React from "react";
import { Users, CreditCard, DollarSign, Activity, Cpu } from "lucide-react";
import { Card } from "../ui/Card";

interface KpiCardsProps {
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    estimatedMrr: number;
    compedUsersCount: number;
    totalAudits: number;
    apiUsageLast30Days: { total: number }[];
  };
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  const totalAiCalls = stats.apiUsageLast30Days.reduce((acc, curr) => acc + curr.total, 0);

  const kpis = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      desc: "Registered user accounts",
      icon: <Users className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      desc: "Paid active tier users",
      icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: "Estimated MRR",
      value: `$${stats.estimatedMrr}`,
      desc: "From real Stripe plans",
      icon: <DollarSign className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: "Comped Users",
      value: stats.compedUsersCount,
      desc: "Admin granted access",
      icon: <Users className="w-5 h-5 text-zinc-500" />,
    },
    {
      title: "Total Audits Run",
      value: stats.totalAudits,
      desc: "Site diagnostic operations",
      icon: <Activity className="w-5 h-5 text-rose-500" />,
    },
    {
      title: "Total AI Calls (30d)",
      value: totalAiCalls,
      desc: "Combined model generations",
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-550 uppercase">
              {kpi.title}
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-50 border-2 border-zinc-950 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]">
              {kpi.icon}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono text-zinc-950 tracking-tight">
              {kpi.value}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-1">{kpi.desc}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
export default KpiCards;
