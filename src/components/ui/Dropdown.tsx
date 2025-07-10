import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: string[];
  optionLabels?: { [key: string]: string };
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  multiSelect?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  optionLabels = {},
  placeholder = "Select an option",
  icon,
  className = "",
  disabled = false,
  multiSelect = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const getDisplayValue = (val: string) => {
    if (optionLabels[val]) return optionLabels[val];
    const labelMap: { [key: string]: string } = {
      'All': 'All Stores',
      'all': 'All Time',
      'today': 'Today',
      'yesterday': 'Yesterday',
      'week': 'Last Week',
      'last7days': 'Last 7 Days',
      'last30days': 'Last 30 Days',
      'thismonth': 'This Month',
      'lastmonth': 'Last Month'
    };
    return labelMap[val] || val;
  };

  const filtered = options.filter(opt => getDisplayValue(opt).toLowerCase().includes(search.toLowerCase()));
  const isSelected = (opt: string) => multiSelect
    ? Array.isArray(value) && value.includes(opt)
    : value === opt;

  const handleSelect = (opt: string) => {
    if (multiSelect) {
      if (!Array.isArray(value)) return;
      if (value.includes(opt)) {
        onChange(value.filter(v => v !== opt));
      } else {
        onChange([...value, opt]);
      }
    } else {
      onChange(opt);
      setOpen(false);
    }
  };

  let display;
  if (multiSelect && Array.isArray(value)) {
    display = value.length > 0 ? value.map(getDisplayValue).join(', ') : <span className="text-gray-400">{placeholder}</span>;
  } else {
    display = value ? getDisplayValue(value as string) : <span className="text-gray-400">{placeholder}</span>;
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {icon}
        </div>
      )}
      <button
        type="button"
        className={`w-full pl-10 pr-10 py-2 border rounded-lg text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''} border-gray-300 dark:border-gray-600`}
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
      >
        {display}
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </button>
      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-lg bg-gray-900 dark:bg-gray-900 border border-gray-700 shadow-lg">
          <div className="p-3 border-b border-gray-800">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search${placeholder ? ' ' + placeholder.toLowerCase() : ''}`}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-400">No results</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-800 text-white ${isSelected(opt) ? 'bg-gray-800 font-semibold' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {getDisplayValue(opt)}
                  {multiSelect && Array.isArray(value) && value.includes(opt) && (
                    <span className="ml-2 text-blue-400">✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;