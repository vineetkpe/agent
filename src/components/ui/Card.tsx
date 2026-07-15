import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "flat" | "shadow";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "flat",
  className = "",
  ...props
}) => {
  const baseStyle = "p-6 rounded-2xl border bg-white";

  const variants = {
    flat: "border-zinc-200 shadow-sm",
    shadow: "border-zinc-950 border-2 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]",
  };

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
