// Ficheiro: apps/client/src/components/ui/GlassButton.tsx

import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'accent'; // default = white/gray, accent = blue
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  isActive = false, 
  size = 'md',
  variant = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 border";
  const sizeStyles = size === 'sm' ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  
  // Lógica de cores dinâmica
  let activeStyles = "";
  let inactiveStyles = "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/10";

  if (variant === 'accent') {
    activeStyles = "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20";
  } else {
    activeStyles = "bg-white/20 text-white border-white/30 shadow-lg";
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${isActive ? activeStyles : inactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};