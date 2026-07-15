import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}) => {
  const baseStyle =
    "px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400",
    secondary: "bg-white text-zinc-950 hover:bg-zinc-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
