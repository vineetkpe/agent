import React from "react";

interface BadgeProps {
  variant?: "violet" | "emerald" | "amber" | "red" | "zinc";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "violet",
  children,
  className = "",
}) => {
  const baseStyle =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm uppercase tracking-wider font-mono";

  const variants = {
    violet: "bg-violet-50 text-violet-600 border-violet-200",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-655 border-amber-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    zinc: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
