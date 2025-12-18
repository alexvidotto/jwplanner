import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';

interface EditableDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

export const EditableDescription = ({ value, onChange }: EditableDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => { setLocalValue(value || ''); }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  if (isEditing) {
    return (
      <textarea autoFocus value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} className="w-full mt-1 p-2 text-sm border border-blue-400 rounded-lg focus:outline-none bg-white shadow-sm" rows={2} placeholder="Ex: Lição 3, ponto 4" />
    );
  }

  if (!value) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mt-1 text-xs text-gray-400 hover:text-blue-500 cursor-pointer flex items-center gap-1 w-fit px-1 rounded hover:bg-gray-50">
        <Plus size={12} /> descrição
      </div>
    );
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mt-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer p-1 rounded border border-transparent hover:border-gray-200 flex items-start gap-1">
      <FileText size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
      <span>{value}</span>
    </div>
  );
};
