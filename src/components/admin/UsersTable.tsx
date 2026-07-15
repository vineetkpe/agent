import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface UserItem {
  id: string;
  email: string;
  createdAt: string;
  subscriptionActive: boolean;
  siteCount: number;
  lastAuditDate: string | null;
}

interface UsersTableProps {
  users: UserItem[];
  totalUsers: number;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, totalUsers }) => {
  return (
    <Card className="p-6 overflow-hidden">
      <div className="mb-6">
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-violet-600 block">
          Directory Registry
        </span>
        <h3 className="text-lg font-extrabold text-zinc-950 font-mono">Registered User Accounts</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs font-mono text-zinc-700">
          <thead>
            <tr className="border-b-2 border-zinc-950 text-zinc-550 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 pr-4">User Email</th>
              <th className="pb-3 px-4">Joined Date</th>
              <th className="pb-3 px-4">Subscription</th>
              <th className="pb-3 px-4 text-center">Sites</th>
              <th className="pb-3 pl-4">Last Audit Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400">
                  No users found in database registry.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 pr-4 font-bold text-zinc-900 truncate max-w-[200px]" title={u.email}>
                    {u.email}
                  </td>
                  <td className="py-4 px-4 text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={u.subscriptionActive ? "emerald" : "zinc"}>
                      {u.subscriptionActive ? "Active Plan ($19)" : "Free / Demo"}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-zinc-900">
                    {u.siteCount}
                  </td>
                  <td className="py-4 pl-4 text-zinc-500">
                    {u.lastAuditDate ? (
                      new Date(u.lastAuditDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    ) : (
                      <span className="text-zinc-300">Never audited</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalUsers > 100 && (
        <div className="mt-4 pt-3 border-t border-zinc-200 text-right">
          <span className="text-[10px] font-mono text-zinc-400 italic">
            Showing 100 most recent of {totalUsers} total users.
          </span>
        </div>
      )}
    </Card>
  );
};
export default UsersTable;
