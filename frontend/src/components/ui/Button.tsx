import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = "", disabled = false, ...props }: ButtonProps) => {
  const baseStyle = "font-medium rounded-lg transition-colors flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 print:hidden",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 print:hidden",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 print:border-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 print:hidden",
    success: "bg-green-100 text-green-700 hover:bg-green-200 print:hidden",
    ghost: "text-gray-500 hover:bg-gray-100 print:hidden"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} {...props}>
      {children}
    </button>
  );
};
