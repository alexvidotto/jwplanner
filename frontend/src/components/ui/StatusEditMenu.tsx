import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'PENDENTE', label: 'Pendente', color: 'bg-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'RECUSADO', label: 'Recusado', color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800' },
];

interface StatusEditMenuProps {
  status: string;
  onChange: (value: string) => void;
  variant?: 'badge' | 'circle';
  disabled?: boolean;
}

export const StatusEditMenu = ({ status, onChange, variant = 'badge', disabled = false }: StatusEditMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(value);
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) setIsOpen(!isOpen);
  };

  const renderTrigger = () => {
    if (variant === 'circle') {
      return (
        <button
          onClick={handleToggle}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={currentStatus.label}
        >
          <div className={`w-4 h-4 rounded-full ${currentStatus.color}`} />
        </button>
      );
    }
    return (
      <button
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium border border-transparent transition-all hover:brightness-95 hover:border-black/10 flex items-center gap-1 ${currentStatus.bg} ${currentStatus.text} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`} />
        {currentStatus.label}
      </button>
    );
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {renderTrigger()}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="py-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => handleSelect(e, opt.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 group transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${opt.color} ring-2 ring-transparent group-hover:ring-gray-200`} />
                <span className={status === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                  {opt.label}
                </span>
                {status === opt.value && <Check size={14} className="ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
