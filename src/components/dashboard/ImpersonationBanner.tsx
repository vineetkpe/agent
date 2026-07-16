import React, { useEffect, useState } from "react";
import { AlertCircle, XOctagon } from "lucide-react";

export const ImpersonationBanner: React.FC = () => {
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);

  useEffect(() => {
    const targetUserEmail = localStorage.getItem("impersonation_target_email");
    const activeToken = localStorage.getItem("impersonation_token");

    if (activeToken && targetUserEmail) {
      setImpersonatingUser(targetUserEmail);
    } else {
      setImpersonatingUser(null);
    }

    const handleStorage = () => {
      const email = localStorage.getItem("impersonation_target_email");
      const token = localStorage.getItem("impersonation_token");
      if (token && email) {
        setImpersonatingUser(email);
      } else {
        setImpersonatingUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleEndImpersonation = () => {
    localStorage.removeItem("impersonation_token");
    localStorage.removeItem("impersonation_target_email");
    localStorage.removeItem("impersonation_target_id");
    window.location.href = "/admin";
  };

  if (!impersonatingUser) return null;

  return (
    <div className="w-full bg-rose-600 border-b-2 border-zinc-950 text-white py-3 px-6 sticky top-0 z-50 flex items-center justify-between font-mono text-xs shadow-[0_2px_4px_rgba(9,9,11,0.1)]">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-white animate-pulse" />
        <span>
          <strong className="uppercase">Admin Control Center Mode:</strong> Impersonating and viewing{" "}
          <span className="underline font-bold text-amber-200">{impersonatingUser}</span>&apos;s account.
        </span>
      </div>
      <button
        onClick={handleEndImpersonation}
        className="px-3.5 py-1 border-2 border-zinc-950 bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] shrink-0"
        type="button"
      >
        <XOctagon className="w-3.5 h-3.5" /> End Impersonation
      </button>
    </div>
  );
};
