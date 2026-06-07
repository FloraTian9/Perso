import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const variantClass = {
  primary: "bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-400",
  secondary: "border border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500 disabled:text-neutral-500",
  ghost: "bg-transparent text-neutral-300 hover:bg-neutral-900 disabled:text-neutral-600",
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded px-4 text-sm font-medium transition disabled:cursor-not-allowed ${variantClass[variant]} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
