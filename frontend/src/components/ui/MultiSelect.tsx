import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
}

export const MultiSelect = ({ options, selectedValues, onChange, placeholder = "Selecione...", label }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange(filteredOptions.map(o => o.value));
    }
  };

  return (
    <div className="relative" ref={popupRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-sm font-medium text-gray-700 min-w-[200px]"
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} selecionado${selectedValues.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 w-72 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-96">
          <div className="p-2 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {filteredOptions.length > 0 && (
               <button 
                 onClick={handleSelectAll}
                 className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-left px-1"
               >
                 {selectedValues.length === filteredOptions.length ? 'Desmarcar todos' : 'Selecionar visíveis'}
               </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Nenhuma opção encontrada</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate flex-1 text-left">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
          
          <div className="p-2 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-500">
             <span>{selectedValues.length} de {options.length}</span>
             <button onClick={() => onChange([])} className="text-red-500 hover:text-red-700 hover:underline">Limpar</button>
          </div>
        </div>
      )}
    </div>
  );
};
