import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
  placeholder?: string;
}

export const EditableField = ({ value, onChange, className = "", placeholder = "" }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
  };

  if (isEditing) {
    return (
      <input autoFocus value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} placeholder={placeholder} className={`bg-white border border-blue-400 rounded px-1 outline-none shadow-sm min-w-[60px] ${className}`} />
    );
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`cursor-pointer hover:bg-gray-100 rounded px-1 border border-transparent hover:border-gray-200 transition-colors ${className}`} title="Clique para editar">
      {value}
    </div>
  );
};
