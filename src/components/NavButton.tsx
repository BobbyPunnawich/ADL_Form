"use client";

interface NavButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  type?: "button" | "submit";
}

export default function NavButton({
  onClick,
  disabled,
  variant = "primary",
  children,
  type = "button",
}: NavButtonProps) {
  const base =
    "min-h-[64px] px-10 rounded-2xl text-xl font-bold transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md",
    secondary: "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200 active:bg-gray-300",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
