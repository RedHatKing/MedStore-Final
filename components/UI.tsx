
import React, { useState, useEffect, useRef } from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'secondary' }>(
  ({ children, variant = 'primary', className = '', ...props }, ref) => {
    const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-primary text-white hover:bg-secondary active:bg-teal-800 dark:bg-primary dark:hover:bg-secondary",
      danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, className = '', ...props }, ref) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        ref={ref}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
        {...props}
      />
    </div>
  )
);
Input.displayName = 'Input';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <select
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export interface Option {
  value: string;
  label: string;
}

export const SearchableSelect: React.FC<{
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}> = ({ label, value, options, onChange, placeholder = 'Select...', className = '', inputRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal search text with external value change
  useEffect(() => {
    const selected = options.find(o => o.value === value);
    if (selected) {
      setSearch(selected.label);
    } else {
      // Allow custom values that aren't in the list (Free text support)
      setSearch(value || '');
    }
  }, [value, options]);

  // Handle outside click to close and reset text
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Ensure the text matches the current selected value on blur
        const selected = options.find(o => o.value === value);
        setSearch(selected ? selected.label : value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, options]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`mb-3 relative ${className}`} ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            // Allow typing to update parent immediately (Free text)
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
        />
         <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && search && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border dark:border-gray-700">
            {filtered.length === 0 ? (
                <li className="text-gray-400 italic select-none relative py-2 pl-3 pr-9 text-xs">No matches (New Item)</li>
            ) : (
                filtered.map((opt) => (
                    <li
                        key={opt.value}
                        className="text-gray-900 dark:text-gray-100 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                            onChange(opt.value);
                            setSearch(opt.label);
                            setIsOpen(false);
                        }}
                    >
                        <span className={`block truncate ${value === opt.value ? 'font-bold text-primary' : 'font-normal'}`}>
                            {opt.label}
                        </span>
                         {value === opt.value && (
                           <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                             <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                             </svg>
                           </span>
                         )}
                    </li>
                ))
            )}
        </ul>
      )}
    </div>
  );
};

export const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => (
    <div ref={ref} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  )
);
Card.displayName = 'Card';
